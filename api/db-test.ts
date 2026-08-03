import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Only GET allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(503).json({ ok: false, error: 'Health check not configured' });
  }
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized',
      hint: 'Send Authorization: Bearer <CRON_SECRET>',
    });
  }

  try {
    const result = await query<{ now: string }>('SELECT NOW() as now');
    return res.status(200).json({
      ok: true,
      now: result.rows[0]?.now,
    });
  } catch (err: any) {
    console.error('[db-test] DB connection failed:', err);
    const errorMessage = err?.message || String(err);
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    return res.status(500).json({
      ok: false,
      error: 'Database connection failed',
      detail: errorMessage,
      hasDatabaseUrl: hasDbUrl,
      // Show first few chars of connection string for debugging (safe - no password)
      connectionHint: hasDbUrl 
        ? process.env.DATABASE_URL?.substring(0, 30) + '...' 
        : 'DATABASE_URL not set',
    });
  }
}

