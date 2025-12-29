// Admin endpoint to view security logs
// GET /api/admin/security-logs

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from '../utils/middleware';
import { requireAdminAuth } from '../utils/admin-auth';
import { safeErrorResponse } from '../utils/security';
import { getRecentSecurityEvents, countSecurityEvents } from '../utils/security-logging';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  // Require admin authentication
  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  try {
    const limit = Number(req.query.limit) || 100;
    const eventType = req.query.eventType as string | undefined;
    const success = req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined;
    const userIdFilter = req.query.userId as string | undefined;

    // Get recent events
    const events = await getRecentSecurityEvents(
      Math.min(limit, 1000), // Cap at 1000
      eventType,
      success,
      userIdFilter
    );

    // Get counts
    const totalCount = await countSecurityEvents();
    const failedCount = await countSecurityEvents(undefined, false);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFailedCount = await countSecurityEvents(undefined, false, last24Hours);

    return res.status(200).json({
      ok: true,
      events,
      stats: {
        total: totalCount,
        failed: failedCount,
        failedLast24h: recentFailedCount,
      },
    });
  } catch (err: any) {
    console.error('[admin/security-logs] Failed to get security logs:', err);
    return safeErrorResponse(
      res,
      500,
      'FAILED_TO_GET_LOGS',
      'Failed to retrieve security logs'
    );
  }
}

