// Admin: Security logs
// GET /api/admin/security-logs?limit=50&eventType=auth_failed&success=false

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from '../utils/middleware';
import { safeErrorResponse, verifyJWT } from '../utils/security';
import { getRecentSecurityEvents } from '../utils/security-logging';

function requireAdminAuth(req: VercelRequest): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
  return decoded?.userId ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const adminId = requireAdminAuth(req);
  if (!adminId) return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Admin authentication required');

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const eventType = req.query.eventType as string | undefined;
  const successParam = req.query.success;
  const success = successParam === 'true' ? true : successParam === 'false' ? false : undefined;
  const userId = req.query.userId as string | undefined;

  try {
    const events = await getRecentSecurityEvents(limit, eventType, success, userId);
    return res.status(200).json({ ok: true, count: events.length, events });
  } catch (err: any) {
    console.error('[admin/security-logs]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
