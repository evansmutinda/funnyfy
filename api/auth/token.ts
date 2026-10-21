// JWT Token Generation Endpoint
// Generates JWT tokens for mobile app authentication
// POST /api/auth/token
//
// Identity: prefer existing user matched by RevenueCat ids (survives reinstall
// when Play/RC restore resolves the same subscriber). Only create a new user
// when no RC identity matches.
//
// Reclaim: after sync finds a prior account, client presents a short-lived
// reclaimToken minted by sync-subscription — bare userId is never enough.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query } from '../_utils/db';
import { applyMiddleware, parseBody } from '../_utils/middleware';
import { safeErrorResponse } from '../_utils/security';
import { validateBody } from '../_utils/validation';
import { getCurrentMonthDate } from '../_utils/usage';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

const tokenRequestSchema = z.object({
  /** @deprecated Prefer reclaimToken — bare userId alone is rejected */
  userId: z.string().uuid().optional(),
  /** Short-lived JWT from sync-subscription (purpose=reclaim) */
  reclaimToken: z.string().min(20).optional(),
  /** @deprecated Prefer revenuecatIds — kept for older clients */
  revenuecatUserId: z.string().optional(),
  revenuecatAppUserId: z.string().optional(),
  revenuecatIds: z.array(z.string().min(1)).optional(),
});

const TOKEN_EXPIRATION = '30d';

function uniqueIds(...groups: Array<string | string[] | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    const list = Array.isArray(group) ? group : group ? [group] : [];
    for (const raw of list) {
      const id = String(raw || '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

async function findUserByRevenueCatIds(ids: string[]): Promise<string | null> {
  if (ids.length === 0) return null;

  const month = getCurrentMonthDate();
  const result = await query<{ id: string; usage: number }>(
    `
      SELECT u.id, COALESCE(MAX(ut.count), 0)::int AS usage
      FROM users u
      LEFT JOIN usage_tracking ut
        ON ut.user_id = u.id AND ut.month = $1
      WHERE u.revenuecat_user_id = ANY($2::text[])
         OR u.id::text = ANY($2::text[])
      GROUP BY u.id
      ORDER BY COALESCE(MAX(ut.count), 0) DESC, u.created_at ASC
      LIMIT 1
    `,
    [month, ids],
  );

  return result.rows[0]?.id ?? null;
}

function verifyReclaimToken(token: string): { userId: string; fromUserId?: string } | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      sub?: string;
      purpose?: string;
      fromUserId?: string;
    };
    if (decoded.purpose !== 'reclaim') return null;
    const userId = decoded.userId || decoded.sub;
    if (!userId || typeof userId !== 'string') return null;
    return { userId, fromUserId: decoded.fromUserId };
  } catch {
    return null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;

  const bodyResult = parseBody(req);
  if (!bodyResult.success) {
    return safeErrorResponse(res, bodyResult.status, bodyResult.error);
  }

  const validation = validateBody(tokenRequestSchema, bodyResult.data);
  if (!validation.success) {
    return safeErrorResponse(res, 400, validation.error);
  }

  const { userId, reclaimToken, revenuecatUserId, revenuecatAppUserId, revenuecatIds } =
    validation.data;

  if (!JWT_SECRET) {
    console.error('[auth/token] JWT_SECRET not configured');
    return safeErrorResponse(
      res,
      500,
      'AUTH_CONFIG_ERROR',
      'Authentication not configured. Please set JWT_SECRET environment variable.'
    );
  }

  try {
    let finalUserId: string | null = null;
    const rcIds = uniqueIds(revenuecatIds, revenuecatUserId, revenuecatAppUserId);
    const primaryRcId = rcIds[0] || null;

    if (reclaimToken) {
      const reclaim = verifyReclaimToken(reclaimToken);
      if (!reclaim) {
        return safeErrorResponse(res, 401, 'INVALID_RECLAIM_TOKEN', 'Reclaim token invalid or expired');
      }

      const userResult = await query<{ id: string }>(
        `SELECT id FROM users WHERE id = $1 LIMIT 1`,
        [reclaim.userId]
      );
      if (userResult.rows.length === 0) {
        return safeErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      finalUserId = userResult.rows[0].id;
      console.log(
        `[auth/token] Reclaim token accepted for ${finalUserId} from=${reclaim.fromUserId || 'n/a'}`
      );

      if (primaryRcId) {
        await query(
          `UPDATE users
           SET revenuecat_user_id = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [primaryRcId, finalUserId]
        );
      }
    } else if (userId) {
      // Bare userId minting is an account-takeover vector — reject.
      return safeErrorResponse(
        res,
        403,
        'USER_ID_REQUIRES_RECLAIM',
        'Pass reclaimToken from sync-subscription, or authenticate via RevenueCat ids'
      );
    } else if (rcIds.length > 0) {
      finalUserId = await findUserByRevenueCatIds(rcIds);

      if (finalUserId) {
        // Keep a stable RC link (prefer original / first id) when unset or already that value.
        if (primaryRcId) {
          await query(
            `UPDATE users
             SET revenuecat_user_id = COALESCE(revenuecat_user_id, $1),
                 updated_at = NOW()
             WHERE id = $2`,
            [primaryRcId, finalUserId]
          );
        }
        console.log(
          `[auth/token] Reused RC-linked user ${finalUserId} for ids=${rcIds.join(',')}`
        );
      } else {
        const insertResult = await query<{ id: string }>(
          `
            INSERT INTO users
              (revenuecat_user_id, subscription_status, subscription_tier,
               trial_generations_used, billing_date, created_at, updated_at)
            VALUES ($1, 'trial', 'trial', 0, CURRENT_DATE, NOW(), NOW())
            RETURNING id
          `,
          [primaryRcId]
        );

        finalUserId = insertResult.rows[0]?.id || null;
        console.log(
          `[auth/token] Created user ${finalUserId} for new RC id ${primaryRcId}`
        );
      }
    } else {
      const insertResult = await query<{ id: string }>(
        `
          INSERT INTO users
            (subscription_status, subscription_tier,
             trial_generations_used, billing_date, created_at, updated_at)
          VALUES ('trial', 'trial', 0, CURRENT_DATE, NOW(), NOW())
          RETURNING id
        `,
        []
      );

      finalUserId = insertResult.rows[0]?.id || null;
    }

    if (!finalUserId) {
      return safeErrorResponse(
        res,
        500,
        'USER_CREATION_FAILED',
        'Failed to create or find user'
      );
    }

    const token = jwt.sign(
      {
        userId: finalUserId,
        sub: finalUserId,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRATION,
      }
    );

    return res.status(200).json({
      ok: true,
      token,
      userId: finalUserId,
      expiresIn: TOKEN_EXPIRATION,
      message: 'Token generated successfully',
    });
  } catch (err: any) {
    console.error('[auth/token] Failed to generate token:', err);
    const hint = err?.message?.replace(/password=\S+/gi, 'password=***') || 'unknown';
    return res.status(500).json({ ok: false, error: 'TOKEN_GENERATION_FAILED', hint });
  }
}
