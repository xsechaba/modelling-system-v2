import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: NextRequest) {
  try {
    const { host, port, database, user, password } = await req.json();

    if (!host || !port || !database || !user) {
      return NextResponse.json({ error: 'Missing required connection parameters' }, { status: 400 });
    }

    const client = new Client({
      host,
      port: parseInt(port),
      database,
      user,
      password,
      connectionTimeoutMillis: 10000, // 10s timeout
    });

    await client.connect();

    // Query to get all user tables (exclude system tables)
    const tablesQuery = `
      SELECT table_schema || '.' || table_name AS full_name, table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `;

    const res = await client.query(tablesQuery);
    await client.end();

    const tables = res.rows.map(row => ({
      name: row.full_name,
      schema: row.table_schema,
      tableName: row.table_name,
      selected: false
    }));

    return NextResponse.json({ tables });
  } catch (err: any) {
    console.error('Database connection error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
