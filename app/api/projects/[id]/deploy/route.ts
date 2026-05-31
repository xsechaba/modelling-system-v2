import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Client } from 'pg';

/**
 * POST /api/projects/[id]/deploy
 * Converts the generated schema into PostgreSQL DDL and executes it against a target Postgres database.
 *
 * Body: { host, port, database, user, password, schema? }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let body: { host: string; port: number; database: string; user: string; password: string; schema?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { host, port, database, user, password, schema: pgSchema } = body;

  if (!host || !port || !database || !user) {
    return NextResponse.json({ error: 'Missing required connection parameters (host, port, database, user)' }, { status: 400 });
  }

  // ---------- Load project state ----------
  const state = await prisma.projectState.findUnique({ where: { projectId: id } });
  if (!state?.stateData) {
    return NextResponse.json({ error: 'No project state found' }, { status: 404 });
  }

  const parsed = JSON.parse(state.stateData);
  const schemaData = parsed.schema;
  if (!schemaData?.nodes || schemaData.nodes.length === 0) {
    return NextResponse.json({ error: 'No schema to deploy. Generate a schema first.' }, { status: 400 });
  }

  // ---------- Build DDL statements ----------
  const targetSchema = pgSchema || 'public';
  const logs: string[] = [];
  const ddlStatements: string[] = [];

  // Map PG type from shorthand column definitions
  function inferPgType(colStr: string): string {
    const lower = colStr.toLowerCase();
    if (lower.includes('integer') || lower.includes('int')) return 'INTEGER';
    if (lower.includes('bigint')) return 'BIGINT';
    if (lower.includes('numeric') || lower.includes('decimal') || lower.includes('float') || lower.includes('double') || lower.includes('money') || lower.includes('amount') || lower.includes('price') || lower.includes('cost') || lower.includes('revenue') || lower.includes('total') || lower.includes('avg') || lower.includes('rate') || lower.includes('ratio') || lower.includes('percent') || lower.includes('score') || lower.includes('weight') || lower.includes('value')) return 'NUMERIC';
    if (lower.includes('boolean') || lower.includes('bool') || lower.includes('flag') || lower.includes('is_')) return 'BOOLEAN';
    if (lower.includes('timestamp')) return 'TIMESTAMP';
    if (lower.includes('date')) return 'DATE';
    if (lower.includes('time')) return 'TIME';
    if (lower.includes('text') || lower.includes('description') || lower.includes('comment') || lower.includes('note')) return 'TEXT';
    // Default: if it ends with _key or _id, likely integer FK/PK
    const colName = colStr.split(' ')[0].toLowerCase();
    if (colName.endsWith('_key') || colName.endsWith('_id') || colName === 'id') return 'INTEGER';
    if (colName.includes('count') || colName.includes('quantity') || colName.includes('num_') || colName.includes('number')) return 'INTEGER';
    if (colName.includes('amount') || colName.includes('price') || colName.includes('cost') || colName.includes('revenue') || colName.includes('total') || colName.includes('avg') || colName.includes('rate') || colName.includes('margin') || colName.includes('percent')) return 'NUMERIC';
    if (colName.includes('date') || colName.includes('_at') || colName.includes('created') || colName.includes('updated')) return 'TIMESTAMP';
    if (colName.includes('name') || colName.includes('title') || colName.includes('label') || colName.includes('category') || colName.includes('type') || colName.includes('status') || colName.includes('code')) return 'VARCHAR(255)';
    return 'VARCHAR(255)';
  }

  // Separate dimensions and facts — create dimensions first so FK references exist
  const dimNodes = schemaData.nodes.filter((n: any) => n.type !== 'factNode');
  const factNodes = schemaData.nodes.filter((n: any) => n.type === 'factNode');
  const allNodes = [...dimNodes, ...factNodes];

  // Schema creation
  if (targetSchema !== 'public') {
    ddlStatements.push(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}";`);
  }

  for (const node of allNodes) {
    const tableName = node.data.label || node.id;
    const isFact = node.type === 'factNode';
    const cols: string[] = node.data.cols || [];

    const columnDefs: string[] = [];
    let pkCol: string | null = null;

    for (const colStr of cols) {
      const colName = colStr.split(' ')[0];
      const isPK = colStr.includes('(PK)');
      const pgType = inferPgType(colStr);

      if (isPK) {
        pkCol = colName;
        columnDefs.push(`  "${colName}" ${pgType} NOT NULL`);
      } else {
        columnDefs.push(`  "${colName}" ${pgType}`);
      }
    }

    let ddl = `CREATE TABLE IF NOT EXISTS "${targetSchema}"."${tableName}" (\n`;
    ddl += columnDefs.join(',\n');

    if (pkCol) {
      ddl += `,\n  PRIMARY KEY ("${pkCol}")`;
    }

    ddl += `\n);`;
    ddlStatements.push(ddl);
  }

  // Foreign key constraints from edges
  for (const edge of (schemaData.edges || [])) {
    // In the stored schema, edge.source = dimension table (PK side),
    // edge.target = fact table (FK side). Foreign key lives on the fact table.
    const dimTable = edge.source;
    const factTable = edge.target;

    const dimNode = schemaData.nodes.find((n: any) => (n.data.label || n.id) === dimTable);
    const factNode = schemaData.nodes.find((n: any) => (n.data.label || n.id) === factTable);
    if (!dimNode || !factNode) continue;

    // PK is on the dimension table
    const dimPKCol = (dimNode.data.cols || []).find((c: string) => c.includes('(PK)'));
    const dimPK = dimPKCol ? dimPKCol.split(' ')[0] : null;

    // FK is on the fact table — find a (FK) column matching the dim PK name
    let fkCol: string | null = null;
    for (const colStr of (factNode.data.cols || [])) {
      if (colStr.includes('(FK)')) {
        const cn = colStr.split(' ')[0];
        if (dimPK && cn === dimPK) {
          fkCol = cn;
          break;
        }
        if (edge.sourceColumn && cn === edge.sourceColumn) {
          fkCol = cn;
          break;
        }
      }
    }

    // Fallback: use edge metadata only — do NOT assume the FK col name matches the dim PK
    if (!fkCol && edge.targetColumn) fkCol = edge.targetColumn;

    // Only generate the constraint if the FK column actually exists in the fact table
    const factColNames = (factNode.data.cols || []).map((c: string) => c.split(' ')[0]);
    if (fkCol && dimPK && factColNames.includes(fkCol)) {
      const constraintName = `fk_${factTable}_${fkCol}`.substring(0, 63);
      ddlStatements.push(
        `ALTER TABLE "${targetSchema}"."${factTable}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${fkCol}") REFERENCES "${targetSchema}"."${dimTable}" ("${dimPK}") ON DELETE SET NULL;`
      );
    }
  }

  logs.push(`Generated ${ddlStatements.length} DDL statements for ${allNodes.length} tables`);

  // ---------- Execute against Postgres ----------
  const client = new Client({
    host,
    port: Number(port),
    database,
    user,
    password,
    connectionTimeoutMillis: 10000,
    // Disable SSL for local connections
    ssl: false,
  });

  try {
    logs.push(`Connecting to PostgreSQL at ${host}:${port}/${database}...`);
    await client.connect();
    logs.push('Connected successfully');

    // Execute each statement
    for (const ddl of ddlStatements) {
      const tableName = ddl.match(/"([^"]+)"\.?"?([^"(]*)"?/)?.[2] || ddl.substring(0, 60);
      try {
        await client.query(ddl);
        logs.push(`✓ ${ddl.startsWith('ALTER') ? 'Constraint' : 'Table'}: ${tableName}`);
      } catch (err: any) {
        // If table/constraint already exists, log warning but continue
        if (err.code === '42P07' || err.code === '42710') {
          logs.push(`⚠ Already exists, skipping: ${tableName}`);
        } else {
          logs.push(`✗ Failed: ${tableName} — ${err.message}`);
        }
      }
    }

    logs.push('');
    logs.push('Deployment completed successfully');

    // Update project state
    try {
      const stateRes = await prisma.projectState.findUnique({ where: { projectId: id } });
      if (stateRes) {
        const stateDataParsed = JSON.parse(stateRes.stateData || '{}');
        const completedSteps: string[] = JSON.parse(stateRes.completedSteps || '[]');
        if (!completedSteps.includes('deploy')) completedSteps.push('deploy');

        stateDataParsed.deployedAt = Date.now();
        stateDataParsed.deployTarget = { host, port, database, schema: targetSchema };
        stateDataParsed.deployLogs = { success: true, logs };

        await prisma.projectState.update({
          where: { projectId: id },
          data: {
            currentStep: 'deploy',
            completedSteps: JSON.stringify(completedSteps),
            stateData: JSON.stringify(stateDataParsed),
          },
        });
      }
    } catch (stateErr) {
      console.warn('Failed to update project state after deploy:', stateErr);
    }

    return NextResponse.json({ success: true, logs, ddl: ddlStatements });
  } catch (connErr: any) {
    const errMsg = connErr?.message || connErr?.code || JSON.stringify(connErr) || 'Unknown error';
    logs.push(`Connection failed: ${errMsg}`);
    if (connErr?.code) logs.push(`Error code: ${connErr.code}`);
    // Persist failed deploy logs so the user can see them on return
    try {
      const stateRes = await prisma.projectState.findUnique({ where: { projectId: id } });
      if (stateRes) {
        const stateDataParsed = JSON.parse(stateRes.stateData || '{}');
        stateDataParsed.deployLogs = { success: false, logs };
        await prisma.projectState.update({
          where: { projectId: id },
          data: { stateData: JSON.stringify(stateDataParsed) },
        });
      }
    } catch { /* best-effort */ }
    return NextResponse.json({ success: false, logs, ddl: ddlStatements }, { status: 500 });
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

/**
 * GET /api/projects/[id]/deploy
 * Returns the DDL preview without executing it.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const state = await prisma.projectState.findUnique({ where: { projectId: id } });
  if (!state?.stateData) {
    return NextResponse.json({ error: 'No project state found' }, { status: 404 });
  }

  const parsed = JSON.parse(state.stateData);
  const schemaData = parsed.schema;
  if (!schemaData?.nodes) {
    return NextResponse.json({ ddl: [], tables: 0 });
  }

  const targetSchema = 'public';
  const ddlStatements: string[] = [];

  function inferPgType(colStr: string): string {
    const lower = colStr.toLowerCase();
    if (lower.includes('integer') || lower.includes('int')) return 'INTEGER';
    if (lower.includes('bigint')) return 'BIGINT';
    if (lower.includes('numeric') || lower.includes('decimal') || lower.includes('float') || lower.includes('double') || lower.includes('money') || lower.includes('amount') || lower.includes('price') || lower.includes('cost') || lower.includes('revenue') || lower.includes('total') || lower.includes('avg') || lower.includes('rate') || lower.includes('ratio') || lower.includes('percent') || lower.includes('score') || lower.includes('weight') || lower.includes('value')) return 'NUMERIC';
    if (lower.includes('boolean') || lower.includes('bool') || lower.includes('flag') || lower.includes('is_')) return 'BOOLEAN';
    if (lower.includes('timestamp')) return 'TIMESTAMP';
    if (lower.includes('date')) return 'DATE';
    if (lower.includes('time')) return 'TIME';
    if (lower.includes('text') || lower.includes('description') || lower.includes('comment') || lower.includes('note')) return 'TEXT';
    const colName = colStr.split(' ')[0].toLowerCase();
    if (colName.endsWith('_key') || colName.endsWith('_id') || colName === 'id') return 'INTEGER';
    if (colName.includes('count') || colName.includes('quantity') || colName.includes('num_') || colName.includes('number')) return 'INTEGER';
    if (colName.includes('amount') || colName.includes('price') || colName.includes('cost') || colName.includes('revenue') || colName.includes('total') || colName.includes('avg') || colName.includes('rate') || colName.includes('margin') || colName.includes('percent')) return 'NUMERIC';
    if (colName.includes('date') || colName.includes('_at') || colName.includes('created') || colName.includes('updated')) return 'TIMESTAMP';
    if (colName.includes('name') || colName.includes('title') || colName.includes('label') || colName.includes('category') || colName.includes('type') || colName.includes('status') || colName.includes('code')) return 'VARCHAR(255)';
    return 'VARCHAR(255)';
  }

  const dimNodes = schemaData.nodes.filter((n: any) => n.type !== 'factNode');
  const factNodes = schemaData.nodes.filter((n: any) => n.type === 'factNode');
  const allNodes = [...dimNodes, ...factNodes];

  for (const node of allNodes) {
    const tableName = node.data.label || node.id;
    const cols: string[] = node.data.cols || [];
    const columnDefs: string[] = [];
    let pkCol: string | null = null;

    for (const colStr of cols) {
      const colName = colStr.split(' ')[0];
      const isPK = colStr.includes('(PK)');
      const pgType = inferPgType(colStr);
      if (isPK) {
        pkCol = colName;
        columnDefs.push(`  "${colName}" ${pgType} NOT NULL`);
      } else {
        columnDefs.push(`  "${colName}" ${pgType}`);
      }
    }

    let ddl = `CREATE TABLE IF NOT EXISTS "${targetSchema}"."${tableName}" (\n`;
    ddl += columnDefs.join(',\n');
    if (pkCol) ddl += `,\n  PRIMARY KEY ("${pkCol}")`;
    ddl += `\n);`;
    ddlStatements.push(ddl);
  }

  // FK constraints
  for (const edge of (schemaData.edges || [])) {
    const sourceNode = schemaData.nodes.find((n: any) => (n.data.label || n.id) === edge.source);
    const targetNode = schemaData.nodes.find((n: any) => (n.data.label || n.id) === edge.target);
    if (!sourceNode || !targetNode) continue;

    const targetPKCol = (targetNode.data.cols || []).find((c: string) => c.includes('(PK)'));
    const targetPK = targetPKCol ? targetPKCol.split(' ')[0] : null;

    let fkCol: string | null = null;
    for (const colStr of (sourceNode.data.cols || [])) {
      if (colStr.includes('(FK)')) {
        const cn = colStr.split(' ')[0];
        if (targetPK && cn === targetPK) { fkCol = cn; break; }
        if (edge.sourceColumn && cn === edge.sourceColumn) { fkCol = cn; break; }
      }
    }
    if (!fkCol && edge.sourceColumn) fkCol = edge.sourceColumn;
    if (!fkCol && targetPK) fkCol = targetPK;

    // Only generate the constraint if the FK column actually exists in the source table
    const sourceColNames = (sourceNode.data.cols || []).map((c: string) => c.split(' ')[0]);
    if (fkCol && targetPK && sourceColNames.includes(fkCol)) {
      const constraintName = `fk_${edge.source}_${fkCol}`.substring(0, 63);
      ddlStatements.push(
        `ALTER TABLE "${targetSchema}"."${edge.source}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${fkCol}") REFERENCES "${targetSchema}"."${edge.target}" ("${targetPK}") ON DELETE SET NULL;`
      );
    }
  }

  // Check previous deployment info
  const deployedAt = parsed.deployedAt || null;
  const deployTarget = parsed.deployTarget || null;
  const deployLogs = parsed.deployLogs || null;

  return NextResponse.json({
    ddl: ddlStatements,
    tables: allNodes.length,
    factCount: factNodes.length,
    dimCount: dimNodes.length,
    deployedAt,
    deployTarget,
    deployLogs,
  });
}
