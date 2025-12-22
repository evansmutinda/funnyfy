// Simple database helper using a Supabase Postgres connection.
// Point `DATABASE_URL` to your Supabase project's connection string.
//
// Example (Vercel env):
//   DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
//
// In Supabase:
//   Project Settings → Database → Connection string → URI

import { Pool, QueryResult } from 'pg';

let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure it in Vercel project settings.'
      );
    }

    // Supabase requires TLS; disable certificate verification in serverless environments.
    // For production hardening, you can configure proper CA trust instead.
    poolInstance = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  
  return poolInstance;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
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


