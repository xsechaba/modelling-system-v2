import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const state = await prisma.projectState.findUnique({
      where: { projectId: id },
    });

    if (!state || !state.stateData) {
      return NextResponse.json({ error: 'No state found' }, { status: 404 });
    }

    const parsed = JSON.parse(state.stateData);
    const schema = parsed.schema;

    if (!schema || !schema.nodes) {
       return NextResponse.json({ files: [] });
    }

    const files: { name: string, type: 'sql' | 'yml', content: string }[] = [];

    // 1. Generate Models (SQL)
    schema.nodes.forEach((node: any) => {
       const isFact = node.type === 'factNode';
       const tableName = node.data.label || node.id;
       const columns = node.data.cols.map((c: string) => c.split(' ')[0]);

       let sql = `{{ config(\n    materialized='${isFact ? 'incremental' : 'table'}',\n`;
       if (isFact) sql += `    unique_key='${columns[0]}'\n`;
       sql += `) }}\n\n`;

       sql += `WITH source_data AS (\n`;
       sql += `    SELECT *\n`;
       sql += `    FROM {{ source('raw_data', '${tableName}_src') }}\n`;
       sql += `),\n\n`;

       sql += `final AS (\n`;
       sql += `    SELECT \n`;
       columns.forEach((col: string, i: number) => {
           const isLast = i === columns.length - 1;
           sql += `        ${col}${isLast ? '' : ','}\n`;
       });
       sql += `    FROM source_data\n`;
       sql += `)\n\n`;

       sql += `SELECT * FROM final`;

       files.push({
           name: `${tableName}.sql`,
           type: 'sql',
           content: sql
       });
    });

    // 2. Generate schema.yml
    let yml = `version: 2\n\nmodels:\n`;
    schema.nodes.forEach((node: any) => {
       const tableName = node.data.label || node.id;
       yml += `  - name: ${tableName}\n`;
       yml += `    description: "Auto-generated model for ${tableName}"\n`;
       yml += `    columns:\n`;
       node.data.cols.forEach((colStr: string) => {
           const colName = colStr.split(' ')[0];
           const isPK = colStr.includes('(PK)');
           const isFK = colStr.includes('(FK)');
           let desc = "Standard column";
           if (isPK) desc = "Primary Key";
           if (isFK) desc = "Foreign Key";

           yml += `      - name: ${colName}\n`;
           yml += `        description: "${desc}"\n`;
           if (isPK) {
              yml += `        tests:\n          - unique\n          - not_null\n`;
           }
       });
       yml += `\n`;
    });

    files.push({
        name: '_marts__models.yml',
        type: 'yml',
        content: yml
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
