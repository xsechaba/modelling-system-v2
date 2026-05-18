import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askClaude } from '@/lib/bedrock';
import { PROMPTS } from '@/lib/prompts';

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

    // Prefer bankedRequirements (with formulas) over legacy kpis
    const bankedRequirements: any[] = parsed.bankedRequirements || [];
    const kpis = bankedRequirements.filter((r: any) => r.type === 'kpi');
    const processes = bankedRequirements.filter((r: any) => r.type === 'process');
    const dimensions = bankedRequirements.filter((r: any) => r.type === 'dimension');
    const rules = bankedRequirements.filter((r: any) => r.type === 'rule');

    // ── Call Claude for enriched documentation ──────────────────────────────
    // Build a context payload for the AI
    const schemaContext = schema.nodes.map((n: any) => ({
      table: n.data.label || n.id,
      type: n.type === 'factNode' ? 'fact' : 'dimension',
      columns: n.data.cols,
    }));

    const edgeContext = (schema.edges || []).map((e: any) => ({
      from: e.source,
      to: e.target,
      cardinality: e.label || '1:M',
    }));

    const docUserMessage = `
=== SCHEMA ===
${JSON.stringify(schemaContext, null, 2)}

=== RELATIONSHIPS ===
${JSON.stringify(edgeContext, null, 2)}

=== BANKED REQUIREMENTS ===
${JSON.stringify(bankedRequirements, null, 2)}

=== SOURCE PROFILE SUMMARY ===
${parsed.aiInterpretation ? parsed.aiInterpretation.slice(0, 1500) : 'No profile data available.'}
`;

    let aiDocs: { executiveSummary: string; tableDescriptions: Record<string, { description: string; columns: Record<string, string> }> } | null = null;

    try {
      const raw = await askClaude(PROMPTS.DOCUMENTATION_GENERATOR, docUserMessage, { maxTokens: 3000, temperature: 0.5 });
      // Strip any markdown code fences Claude might add
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      aiDocs = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Documentation AI call failed — falling back to generic descriptions', e);
    }

    const files: { name: string, type: 'sql' | 'yml' | 'md', content: string }[] = [];

    // ── 1. Generate dbt SQL models ───────────────────────────────────────────
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

       sql += `final AS (\n    SELECT \n`;
       columns.forEach((col: string, i: number) => {
           sql += `        ${col}${i < columns.length - 1 ? ',' : ''}\n`;
       });
       sql += `    FROM source_data\n)\n\nSELECT * FROM final`;

       files.push({ name: `${tableName}.sql`, type: 'sql', content: sql });
    });

    // ── 2. Generate schema.yml with AI-enriched descriptions ────────────────
    let yml = `version: 2\n\nmodels:\n`;
    schema.nodes.forEach((node: any) => {
       const tableName = node.data.label || node.id;
       const tableAiDocs = aiDocs?.tableDescriptions?.[tableName];
       const tableDesc = tableAiDocs?.description ?? `Auto-generated ${node.type === 'factNode' ? 'fact' : 'dimension'} table for ${tableName}`;

       yml += `  - name: ${tableName}\n`;
       yml += `    description: "${tableDesc.replace(/"/g, "'")}"\n`;
       yml += `    columns:\n`;

       node.data.cols.forEach((colStr: string) => {
           const colName = colStr.split(' ')[0];
           const isPK = colStr.includes('(PK)');
           const isFK = colStr.includes('(FK)');

           const aiColDesc = tableAiDocs?.columns?.[colName];
           let desc: string;
           if (aiColDesc) {
             desc = aiColDesc;
           } else if (isPK) {
             desc = `Surrogate primary key for ${tableName}`;
           } else if (isFK) {
             desc = `Foreign key reference`;
           } else {
             desc = colName.replace(/_/g, ' ');
           }

           yml += `      - name: ${colName}\n`;
           yml += `        description: "${desc.replace(/"/g, "'")}"\n`;
           if (isPK) {
              yml += `        tests:\n          - unique\n          - not_null\n`;
           }
       });
       yml += `\n`;
    });

    files.push({ name: '_marts__models.yml', type: 'yml', content: yml });

    // ── 3. Generate enriched documentation.md ───────────────────────────────
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const factTables = schema.nodes.filter((n: any) => n.type === 'factNode');
    const dimTables = schema.nodes.filter((n: any) => n.type !== 'factNode');

    let md = `# Dimensional Model Documentation\n`;
    md += `_Generated: ${today}_\n\n`;
    md += `---\n\n`;

    // Executive Summary
    md += `## Executive Summary\n\n`;
    if (aiDocs?.executiveSummary) {
      md += `${aiDocs.executiveSummary}\n\n`;
    } else {
      md += `This dimensional model provides an integrated analytical view of the business, `;
      md += `comprising ${factTables.length} fact table${factTables.length !== 1 ? 's' : ''} and ${dimTables.length} dimension table${dimTables.length !== 1 ? 's' : ''}.\n\n`;
    }

    // Model Overview
    md += `## Model Overview\n\n`;
    md += `| Property | Value |\n| --- | --- |\n`;
    md += `| Methodology | Kimball Star Schema |\n`;
    md += `| Fact Tables | ${factTables.length} |\n`;
    md += `| Dimension Tables | ${dimTables.length} |\n`;
    md += `| Total Tables | ${schema.nodes.length} |\n`;
    md += `| Total Relationships | ${(schema.edges || []).length} |\n\n`;

    // Business Requirements
    if (bankedRequirements.length > 0) {
      md += `## Business Requirements\n\n`;

      if (processes.length > 0) {
        md += `### Business Processes\n`;
        processes.forEach((r: any) => {
          md += `- **${r.name}** _(${r.priority || 'Medium'} priority)_: ${r.description}\n`;
        });
        md += `\n`;
      }

      if (kpis.length > 0) {
        md += `### KPIs & Metrics\n`;
        md += `| KPI | Priority | Formula | Description |\n`;
        md += `| --- | --- | --- | --- |\n`;
        kpis.forEach((r: any) => {
          const formula = r.logic ? `\`${r.logic}\`` : '_TBD_';
          md += `| **${r.name}** | ${r.priority || 'Medium'} | ${formula} | ${r.description || ''} |\n`;
        });
        md += `\n`;
      }

      if (dimensions.length > 0) {
        md += `### Conformed Dimensions\n`;
        dimensions.forEach((r: any) => {
          md += `- **${r.name}**: ${r.description}\n`;
        });
        md += `\n`;
      }

      if (rules.length > 0) {
        md += `### Business Rules\n`;
        rules.forEach((r: any) => {
          md += `- **${r.name}**: ${r.description}\n`;
        });
        md += `\n`;
      }
    } else if (parsed.kpis && parsed.kpis.length > 0) {
      // Legacy fallback
      md += `## Business Requirements\n`;
      parsed.kpis.forEach((kpi: any) => {
        md += `- **${kpi.name}**: ${kpi.description} (Formula: \`${kpi.formula}\`)\n`;
      });
      md += `\n`;
    }

    // Requirements Traceability
    if (kpis.length > 0) {
      md += `## Requirements Traceability\n\n`;
      md += `_Maps each KPI requirement to the fact table column that implements it._\n\n`;
      md += `| Requirement | Type | Implementing Table | Column | Formula |\n`;
      md += `| --- | --- | --- | --- | --- |\n`;

      kpis.forEach((req: any) => {
        // Try to find which fact table has a column matching this KPI
        let matchTable = '_TBD_';
        let matchCol = '_TBD_';
        const kpiSlug = req.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        factTables.forEach((ft: any) => {
          const tableName = ft.data.label || ft.id;
          ft.data.cols.forEach((colStr: string) => {
            const colName = colStr.split(' ')[0].toLowerCase();
            if (colName.includes(kpiSlug) || kpiSlug.includes(colName.replace(/_/g, ''))) {
              matchTable = tableName;
              matchCol = colStr.split(' ')[0];
            }
          });
        });
        const formula = req.logic ? `\`${req.logic}\`` : '_TBD_';
        md += `| ${req.name} | ${req.type} | ${matchTable} | ${matchCol} | ${formula} |\n`;
      });
      md += `\n`;
    }

    // Data Dictionary
    md += `## Data Dictionary\n\n`;
    schema.nodes.forEach((node: any) => {
       const tableName = node.data.label || node.id;
       const isFact = node.type === 'factNode';
       const tableAiDocs = aiDocs?.tableDescriptions?.[tableName];
       const tableDesc = tableAiDocs?.description ?? `${isFact ? 'Fact' : 'Dimension'} table — ${tableName}`;

       md += `### \`${tableName}\` — ${isFact ? 'Fact Table' : 'Dimension Table'}\n\n`;
       md += `${tableDesc}\n\n`;
       md += `| Column | Key | Description |\n`;
       md += `| --- | --- | --- |\n`;

       node.data.cols.forEach((colStr: string) => {
           const parts = colStr.split(' ');
           const name = parts[0];
           const meta = parts.slice(1).join(' ');
           const isPK = meta.includes('(PK)');
           const isFK = meta.includes('(FK)');

           const aiColDesc = tableAiDocs?.columns?.[name];
           let desc: string;
           if (aiColDesc) {
             desc = aiColDesc;
           } else if (isPK) {
             desc = `Surrogate primary key for \`${tableName}\``;
           } else if (isFK) {
             desc = `Foreign key — links to dimension table`;
           } else {
             desc = name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
           }

           const keyLabel = isPK ? '🔑 PK' : isFK ? '🔗 FK' : '';
           md += `| \`${name}\` | ${keyLabel} | ${desc} |\n`;
       });
       md += `\n`;
    });

    // Relationships
    md += `## Relationships\n\n`;
    if (schema.edges && schema.edges.length > 0) {
       md += `| From | To | Cardinality | Join Key |\n`;
       md += `| --- | --- | --- | --- |\n`;
       schema.edges.forEach((edge: any) => {
           const cardinality = edge.label || '1:M';
           md += `| \`${edge.source}\` | \`${edge.target}\` | ${cardinality} | \`${edge.sourceColumn || edge.source + '_key'}\` → \`${edge.targetColumn || edge.target + '_key'}\` |\n`;
       });
       md += `\n`;
    }

    // Source-to-Target Mapping
    md += `## Source-to-Target Mapping\n\n`;
    md += `_Each dbt model reads from a \`{{ source('raw_data', '<table>_src') }}\` reference._\n\n`;
    md += `| Target Model | Source Reference | Materialization | Notes |\n`;
    md += `| --- | --- | --- | --- |\n`;
    schema.nodes.forEach((node: any) => {
      const tableName = node.data.label || node.id;
      const isFact = node.type === 'factNode';
      const mat = isFact ? 'incremental' : 'table';
      const notes = isFact ? 'Append new rows via unique_key' : 'Full refresh on each run';
      md += `| \`${tableName}\` | \`raw_data.${tableName}_src\` | ${mat} | ${notes} |\n`;
    });
    md += `\n`;

    files.push({ name: 'documentation.md', type: 'md', content: md });

    return NextResponse.json({ files });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
