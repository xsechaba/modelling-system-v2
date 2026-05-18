import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Client } from 'pg';
import { profileColumn } from '@/lib/profiler';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let client: Client | null = null;
  try {
    const body = await req.json();
    const { host, port, database, user, password, selectedTables } = body;

    if (!host || !port || !database || !user || !selectedTables || !Array.isArray(selectedTables)) {
      return NextResponse.json({ error: 'Missing required connection parameters or selectedTables array' }, { status: 400 });
    }

    client = new Client({
      host,
      port: parseInt(port, 10),
      database,
      user,
      password,
      connectionTimeoutMillis: 10000,
    });

    await client.connect();

    // Fetch the actual table list from information_schema to validate requested tables
    // This prevents SQL injection by ensuring we only query tables that genuinely exist
    const validTablesRes = await client.query(`
      SELECT table_schema || '.' || table_name AS full_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
    `);
    const validTableNames = new Set(validTablesRes.rows.map((r: any) => r.full_name));

    const files: { name: string; size: number; columns: any[]; rowCount: number; sampleRows: any[] }[] = [];

    for (const tableName of selectedTables) {
      const parts = (tableName as string).split('.');
      const schemaName = parts.length > 1 ? parts[0] : 'public';
      const actualTableName = parts.length > 1 ? parts[1] : tableName;
      const fullName = schemaName + '.' + actualTableName;

      // Reject any table name not in the validated list
      if (!validTableNames.has(fullName)) {
        console.warn(`Skipping unknown or unauthorized table: ${fullName}`);
        continue;
      }

      // Safe to query – table identity confirmed against information_schema
      const res = await client.query('SELECT * FROM "' + schemaName + '"."' + actualTableName + '" LIMIT 1000');
      const rows = res.rows;
      const pseudoSize = rows.length * 100;
      const headers = res.fields.map(f => f.name);

      const columns = headers.map(h => {
        const values = rows.map(r => (r[h] !== null && r[h] !== undefined) ? String(r[h]) : '');
        return profileColumn(h, values);
      });

      const sampleRows = rows.slice(0, 15).map(row => {
        const clean: Record<string, string> = {};
        for (const h of headers) {
          clean[h] = (row[h] !== null && row[h] !== undefined) ? String(row[h]) : '';
        }
        return clean;
      });

      files.push({ name: tableName, size: pseudoSize, columns, rowCount: rows.length, sampleRows });
    }

    await client.end();
    client = null;

    const callouts: { title: string; description: string; severity: 'warning' | 'success' | 'error' }[] = [];
    for (const file of files) {
      for (const col of file.columns) {
        if (col.missingPct > 5) {
          callouts.push({
            title: 'Missing Values in ' + col.name,
            description: col.name + ' is missing in ' + col.missingPct + '% of records. This may impact dimension linkage quality.',
            severity: 'warning',
          });
        }
        if (col.type === 'date' && col.uniqueCount > 30) {
          callouts.push({
            title: 'Date Grain Detected',
            description: col.name + ' has ' + col.uniqueCount + ' unique date values spanning ' + col.dateMin + ' to ' + col.dateMax + '. Strong candidate for a time dimension.',
            severity: 'success',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'HAS NEGATIVES')) {
          callouts.push({
            title: 'Negative Values in ' + col.name,
            description: col.name + ' contains negative values (min: ' + col.min + '). This may indicate returns or adjustments in the raw data.',
            severity: 'error',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'OUTLIERS')) {
          callouts.push({
            title: 'Outliers Detected in ' + col.name,
            description: col.name + ' has a max value (' + col.max + ') more than 5× its mean (' + col.mean + '). Check for data entry errors or exceptional events.',
            severity: 'warning',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'HIGH CARDINALITY') && col.type === 'id') {
          callouts.push({
            title: 'Surrogate Key Candidate: ' + col.name,
            description: col.name + ' has ' + col.uniqueDisplay + ' unique values with ' + col.uniquePct + '% uniqueness — strong primary key candidate.',
            severity: 'success',
          });
        }
        if (col.type === 'numeric' && col.uniqueCount <= 10 && col.uniqueCount > 1) {
          callouts.push({
            title: 'Low-Cardinality Numeric: ' + col.name,
            description: col.name + ' is numeric but only has ' + col.uniqueCount + ' distinct values — may be better modelled as a categorical attribute.',
            severity: 'warning',
          });
        }
      }
    }
    if (callouts.length === 0 && files.length > 0) {
      callouts.push({
        title: 'Quality Checks Passed',
        description: 'All columns passed basic quality checks. No missing values, outliers, or type anomalies detected across ' + files.reduce((s: number, f: any) => s + f.columns.length, 0) + ' columns.',
        severity: 'success',
      });
    }

    const sortedCallouts = callouts.sort((a, b) => {
      const order: Record<string, number> = { error: 0, warning: 1, success: 2 };
      return order[a.severity] - order[b.severity];
    }).slice(0, 3);

    return NextResponse.json({ files, callouts: sortedCallouts });
  } catch (err: any) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    console.error('Database profiling error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
