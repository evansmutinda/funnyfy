// Manual subscription sync endpoint (for testing/recovery)
// Can be called to manually sync a user's subscription from RevenueCat
// In production, this should be protected/admin-only

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Only POST allowed' });
  }

  // In production, add admin/auth check here
  const userId = (req.headers['x-user-id'] as string) || (req.body?.userId as string);

  if (!userId) {
    return res.status(400).json({
      ok: false,
      error: 'userId required'
    });
  }

  // This endpoint would typically call RevenueCat API to get current status
  // For now, it's a placeholder - implement when RevenueCat SDK is integrated
  return res.status(200).json({
    ok: true,
    message: 'Subscription sync endpoint - implement RevenueCat API call here',
    note: 'This should call RevenueCat API to get current subscription status and sync to database'
  });
}
