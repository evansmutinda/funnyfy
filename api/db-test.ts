import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

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

  try {
    const result = await query<{ now: string }>('SELECT NOW() as now');
    return res.status(200).json({
      ok: true,
      now: result.rows[0]?.now,
    });
  } catch (err: any) {
    console.error('[db-test] DB connection failed:', err);
    return res.status(500).json({
      ok: false,
      error: 'Database connection failed',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
}

