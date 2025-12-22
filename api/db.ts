// Simple database helper using a Supabase Postgres connection.
// Point `DATABASE_URL` to your Supabase project's connection string.
//
// Example (Vercel env):
//   DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
//
// In Supabase:
//   Project Settings → Database → Connection string → URI

import { Pool, QueryResult } from 'pg';

// Create a new pool per invocation. This is slightly less efficient than
// a global pool but much safer in serverless and easier to debug.
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure it in your Vercel project settings.'
    );
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = createPool();
  try {
    return await pool.query<T>(text, params);
  } finally {
    // Ensure connections are cleaned up quickly in serverless
    await pool.end().catch(() => {});
  }
}

// Tagged template helper:
//   const rows = await sql`SELECT * FROM jobs WHERE status = ${'pending'}`;
export async function sql<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<QueryResult<T>> {
  const text =
    strings
      .map((s, i) => (i === 0 ? s : `$${i}` + s))
      .join('');
  return query<T>(text, values);
}


