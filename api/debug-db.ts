// Temporary debug endpoint - remove after fixing
// GET /api/debug-db?userId=550e8400-e29b-41d4-a716-446655440000

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = (req.query.userId as string) || TEST_USER_ID;

  res.setHeader('Access-Control-Allow-Origin', '*');

  const results: Record<string, { success: boolean; error?: string; rows?: number }> = {};

  // Test 1: Minimal query
  try {
    const r = await query(`SELECT id FROM users WHERE id::text = $1 OR revenuecat_user_id = $1 LIMIT 1`, [userId]);
    results.minimal = { success: true, rows: r.rows.length };
  } catch (e: any) {
    results.minimal = { success: false, error: e?.message || String(e) };
  }

  // Test 2: Full query with banned_at
  try {
    const r = await query(
      `SELECT id, subscription_tier, subscription_status, trial_generations_used, banned_at
       FROM users WHERE id::text = $1 OR revenuecat_user_id = $1 LIMIT 1`,
      [userId]
    );
    results.fullQuery = { success: true, rows: r.rows.length };
    if (r.rows.length > 0) {
      (results.fullQuery as any).user = r.rows[0];
    }
  } catch (e: any) {
    results.fullQuery = { success: false, error: e?.message || String(e) };
  }

  return res.status(200).json({
    userId,
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    results,
  });
}
