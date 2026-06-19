// DEPRECATED: Cancelling here only updated our database — it did NOT stop Google Play / App Store
// auto-renew. The mobile app now opens the store subscription management page instead.
// This endpoint remains for backwards compatibility but should not be used by current clients.
// Cancellation state is set by RevenueCat webhooks when the user cancels in the store.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
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

  return res.status(410).json({
    ok: false,
    error: 'Use Google Play or App Store subscription settings to cancel auto-renew. The app opens that page via RevenueCat managementURL.',
    code: 'CANCEL_VIA_STORE',
  });
}
