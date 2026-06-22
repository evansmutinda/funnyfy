// Public liveness probe for uptime monitors (UptimeRobot, cron-job.org ping, etc.).
// No auth, no database — use /api/db-test with CRON_SECRET for deep DB checks.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Only GET allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({
    ok: true,
    service: 'funnyfy-api',
    ts: new Date().toISOString(),
  });
}
