/**
 * Combined health endpoints (Hobby plan: max 12 serverless functions).
 * - GET /api/health         — public liveness (no DB)
 * - GET /api/db-test        — rewritten here; requires Bearer CRON_SECRET + DB ping
 * - GET /api/health?check=db — same deep check without the rewrite
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function wantsDbCheck(req: VercelRequest): boolean {
  const check = req.query.check;
  const value = Array.isArray(check) ? check[0] : check;
  return value === 'db' || value === '1' || value === 'true';
}

async function handleDbCheck(req: VercelRequest, res: VercelResponse) {
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
  } catch (err: unknown) {
    console.error('[health/db-test] DB connection failed:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const hasDbUrl = !!process.env.DATABASE_URL;

    return res.status(500).json({
      ok: false,
      error: 'Database connection failed',
      detail: errorMessage,
      hasDatabaseUrl: hasDbUrl,
      connectionHint: hasDbUrl
        ? process.env.DATABASE_URL?.substring(0, 30) + '...'
        : 'DATABASE_URL not set',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Only GET allowed' });
  }

  if (wantsDbCheck(req)) {
    return handleDbCheck(req, res);
  }

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({
    ok: true,
    service: 'funnyfy-api',
    ts: new Date().toISOString(),
  });
}
