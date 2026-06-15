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
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000, // Supabase free tier can be slow to wake from pause
  });

  // Clear cached pool on terminal errors so the next request gets a fresh pool
  cachedPool.on('error', () => {
    cachedPool = null;
  });

  return cachedPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const pool = getPool();
    return await pool.query<T>(text, params);
  } catch (err: any) {
    // Clear pool on connection-level errors so the next invocation retries fresh
    if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND' || err?.message?.includes('password authentication')) {
      cachedPool = null;
    }
    throw err;
  }
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


