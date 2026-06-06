// Simple database helper using a Supabase Postgres connection.
// Point `DATABASE_URL` to your Supabase project's connection string.
//
// Example (Vercel env):
//   DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
//
// In Supabase:
//   Project Settings → Database → Connection string → URI

import { Pool, QueryResult, QueryResultRow } from 'pg';

let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) {
    return cachedPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure it in your Vercel project settings.'
    );
  }

  cachedPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10, // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return cachedPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

// Tagged template helper:
//   const rows = await sql`SELECT * FROM jobs WHERE status = ${'pending'}`;
export async function sql<T extends QueryResultRow = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<QueryResult<T>> {
  const text =
    strings
      .map((s, i) => (i === 0 ? s : `$${i}` + s))
      .join('');
  return query<T>(text, values);
}


