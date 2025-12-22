import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const GLOBAL_MONTHLY_QUOTA = Number(process.env.GLOBAL_MONTHLY_QUOTA || 1000);

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function getCurrentMonthDate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

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

  const currentMonth = getCurrentMonthDate();

  try {
    const result = await query<{ count: number }>(
      `
        SELECT count
        FROM usage_tracking
        WHERE user_id IS NULL AND month = $1
      `,
      [currentMonth]
    );

    const current = result.rows[0]?.count ?? 0;

    return res.status(200).json({
      ok: true,
      usage: {
        current,
        limit: GLOBAL_MONTHLY_QUOTA,
        month: currentMonth,
        tier: 'global-anonymous'
      }
    });
  } catch (err: any) {
    console.error('[usage] Failed to read usage:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to read usage info'
    });
  }
}

