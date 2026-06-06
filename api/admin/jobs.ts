// Admin: Job management
// GET /api/admin/jobs?page=1&limit=20&status=&userId=
// POST /api/admin/jobs?action=retry&jobId=<id>
// POST /api/admin/jobs?action=cancel&jobId=<id>

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import { applyMiddleware } from '../utils/middleware';
import { safeErrorResponse, verifyJWT } from '../utils/security';

function requireAdminAuth(req: VercelRequest): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
  return decoded?.userId ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'POST', 'OPTIONS'])) return;

  const adminId = requireAdminAuth(req);
  if (!adminId) return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Admin authentication required');

  // ── POST actions ──────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const action = req.query.action as string;
    const jobId = req.query.jobId as string;
    if (!jobId) return safeErrorResponse(res, 400, 'MISSING_JOB_ID');

    if (action === 'retry') {
      // Reset failed job back to pending so the queue picks it up again
      await query(
        `UPDATE jobs SET status = 'pending', error_message = NULL, started_at = NULL, completed_at = NULL
         WHERE id = $1 AND status = 'failed'`,
        [jobId]
      );
      return res.status(200).json({ ok: true, message: 'Job requeued' });
    }

    if (action === 'cancel') {
      await query(
        `UPDATE jobs SET status = 'failed', error_message = 'Cancelled by admin', completed_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'processing')`,
        [jobId]
      );
      return res.status(200).json({ ok: true, message: 'Job cancelled' });
    }

    return safeErrorResponse(res, 400, 'UNKNOWN_ACTION');
  }

  // ── GET job list ──────────────────────────────────────────────────────────
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const userId = req.query.userId as string | undefined;

    const conditions: string[] = [];
    const params: any[] = [];
    let p = 1;

    if (status) { conditions.push(`j.status = $${p}`); params.push(status); p++; }
    if (userId) { conditions.push(`j.user_id = $${p}`); params.push(userId); p++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [jobsResult, countResult] = await Promise.all([
      query<any>(
        `SELECT j.id, j.user_id, j.style_id, j.status, j.priority,
                j.output_image_url, j.error_message, j.created_at, j.completed_at,
                u.subscription_tier
         FROM jobs j
         LEFT JOIN users u ON u.id = j.user_id
         ${where}
         ORDER BY j.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM jobs j ${where}`,
        params
      ),
    ]);

    return res.status(200).json({
      ok: true,
      jobs: jobsResult.rows,
      total: countResult.rows[0]?.count ?? 0,
      page,
      limit,
      pages: Math.ceil((countResult.rows[0]?.count ?? 0) / limit),
    });
  } catch (err: any) {
    console.error('[admin/jobs]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
