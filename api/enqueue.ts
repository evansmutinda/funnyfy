// Enqueue endpoint: Creates a job as 'pending' and returns jobId
// Client polls /api/job?id=<jobId> to check status
// This enables async processing via the queue worker

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';
import { STICKER_SHEET_STYLE_ID, getStyleById } from './_utils/styles-config';
import {
  ensureJobSheetExpressionsColumn,
  normalizeStickerExpressionIds,
  validateStickerSheetExpressions,
} from './_utils/sticker-pack';
import { applyMiddleware, parseBody, validateGenerateRequest } from './_utils/middleware';
import { requireAuth } from './_utils/auth';
import { safeErrorResponse } from './_utils/security';
import { checkAllRateLimits } from './_utils/ratelimit';
import { getEstimatedWaitTime } from './_utils/queue-stats';
import { getCurrentMonthDate, getTierQuota, TRIAL_LIMIT } from './_utils/usage';
import { shouldPauseQueue } from './_utils/cost-protection';
import { generationUnavailableResponse } from './_utils/queue-pause';

function getQuotaForTier(tier: string | null): number {
  return getTierQuota(tier);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware (CORS, headers, OPTIONS handling)
  if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;

  // Require authentication
  const userId = requireAuth(req, res);
  if (!userId) return; // Response already sent by requireAuth

  // Parse and validate request body
  const bodyResult = parseBody(req);
  if (!bodyResult.success) {
    return safeErrorResponse(res, bodyResult.status, bodyResult.error);
  }

  const payload = (bodyResult.data?.payload as Record<string, unknown>) ?? {};

  // Validate generation request (styleId, imageUrl)
  const validation = validateGenerateRequest(payload);
  if (!validation.success) {
    return safeErrorResponse(res, 400, validation.error);
  }

  const { styleId, imageUrl } = validation.data;
  const sheetExpressions =
    styleId === STICKER_SHEET_STYLE_ID
      ? normalizeStickerExpressionIds(payload.expressions)
      : [];
  if (styleId === STICKER_SHEET_STYLE_ID) {
    const sheetError = validateStickerSheetExpressions(sheetExpressions);
    if (sheetError) {
      return safeErrorResponse(res, 400, 'INVALID_STICKER_SHEET', sheetError);
    }
  }

  // Hard-block new jobs while queue is paused (billing or daily cap)
  try {
    const pauseCheck = await shouldPauseQueue();
    if (pauseCheck.paused) {
      const body = generationUnavailableResponse();
      return res.status(503).json(body);
    }
  } catch (pauseErr) {
    console.warn('[enqueue] Pause check failed (proceeding):', pauseErr);
  }

  // Look up user
  let userTier: string | null = null;
  let subscriptionStatus: string | null = null;
  let trialGenerationsUsed: number = 0;

  try {
    const userResult = await query<{ 
      subscription_tier: string; 
      subscription_status: string;
      trial_generations_used: number;
    }>(
      `
        SELECT subscription_tier, subscription_status, trial_generations_used
        FROM users
        WHERE id = $1
      `,
      [userId]
    );
    if (userResult.rows.length === 0) {
      return safeErrorResponse(res, 404, 'USER_NOT_FOUND', 'User account not found. Please sign up.');
    }
    
    subscriptionStatus = userResult.rows[0].subscription_status;
    userTier = userResult.rows[0].subscription_tier;
    trialGenerationsUsed = userResult.rows[0].trial_generations_used ?? 0;

    if (subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT)) {
      if (trialGenerationsUsed >= TRIAL_LIMIT) {
        return safeErrorResponse(
          res,
          403,
          'TRIAL_EXPIRED',
          'You\'ve used all 3 free trial generations. Please subscribe to continue.'
        );
      }
    } else if (subscriptionStatus !== 'active') {
      return safeErrorResponse(
        res,
        403,
        'SUBSCRIPTION_INACTIVE',
        'Your subscription is not active. Please subscribe to continue.'
      );
    }
  } catch (userErr) {
    const err = userErr as Error;
    console.error('Failed to look up user:', err?.message ?? err);
    return safeErrorResponse(res, 500, 'USER_LOOKUP_FAILED', 'Failed to verify user account');
  }

  // Validate style exists
  const styleConfig = getStyleById(styleId);
  if (!styleConfig) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_STYLE_ID',
      message: `Invalid styleId: ${styleId}`,
    });
  }

  // Determine user tier and quota
  const isTrialUser = subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);
  const effectiveTier = isTrialUser ? 'trial' : (userTier || 'trial');
  const monthlyQuota = isTrialUser ? TRIAL_LIMIT : getQuotaForTier(userTier);

  // Check all rate limits (IP + Tier Burst + Daily Safety)
  const rateLimitCheck = await checkAllRateLimits(req, userId, effectiveTier, monthlyQuota);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: rateLimitCheck.error,
      ...(rateLimitCheck.details ? { limits: rateLimitCheck.details } : {}),
    });
  }

  // Monthly quota check (primary limit)
  if (!isTrialUser) {
    const currentMonth = getCurrentMonthDate();
    const quotaLimit = getQuotaForTier(userTier);

    try {
      const usageResult = await query<{ id: string; count: number }>(
        `
          SELECT id, count
          FROM usage_tracking
          WHERE user_id = $1 AND month = $2
        `,
        [userId, currentMonth]
      );

      let currentCount = 0;
      if (usageResult.rows.length === 0) {
        await query(
          `
            INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
            VALUES ($1, $2, 0, NOW())
          `,
          [userId, currentMonth]
        );
      } else {
        currentCount = usageResult.rows[0].count ?? 0;
      }

      if (currentCount >= quotaLimit) {
        return res.status(429).json({
          ok: false,
          error: 'QUOTA_EXCEEDED',
          message: `You've used all ${quotaLimit} images this month (${userTier} plan). Upgrade your plan or wait until next month.`,
          usage: {
            current: currentCount,
            limit: quotaLimit,
            month: currentMonth,
            tier: userTier
          }
        });
      }
    } catch (quotaErr) {
      console.error('Quota check failed:', quotaErr);
      return safeErrorResponse(res, 500, 'QUOTA_CHECK_FAILED', 'Failed to check usage quota');
    }
  }

  // Create job as 'pending' (will be processed by queue worker)
  const priority = userTier === 'pro' ? 10 : userTier === 'popular' ? 5 : 1;

  try {
    if (styleId === STICKER_SHEET_STYLE_ID) {
      await ensureJobSheetExpressionsColumn();
    }
    const insertResult = await query<{ id: string }>(
      `
        INSERT INTO jobs (user_id, style_id, status, priority, input_image_url, created_at, sheet_expressions)
        VALUES ($1, $2, 'pending', $3, $4, NOW(), $5)
        RETURNING id
      `,
      [
        userId,
        styleId,
        priority,
        imageUrl,
        styleId === STICKER_SHEET_STYLE_ID ? sheetExpressions.join(',') : null,
      ]
    );

    const jobId = insertResult.rows[0]?.id;

    // Calculate queue position
    const queuePositionResult = await query<{ count: number }>(
      `
        SELECT COUNT(*)::int AS count
        FROM jobs
        WHERE status = 'pending'
          AND (
            priority > $1
            OR (priority = $1 AND created_at < NOW())
          )
      `,
      [priority]
    );
    const queuePosition = queuePositionResult.rows[0]?.count ?? 0;

    // Calculate estimated wait time
    const estimatedWaitTime = await getEstimatedWaitTime(queuePosition);

    // Fire-and-forget background queue processor trigger
    try {
      const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.headers.host || 'localhost:3000';
      const triggerUrl = `${protocol}://${host}/api/cron/process-queue`;
      const cronSecret = process.env.CRON_SECRET;
      
      const fetchHeaders: Record<string, string> = {};
      if (cronSecret) {
        fetchHeaders['Authorization'] = `Bearer ${cronSecret}`;
      }

      fetch(triggerUrl, {
        method: 'GET',
        headers: fetchHeaders
      }).catch(err => {
        console.warn('[enqueue] Failed to trigger background queue execution (catch):', err?.message || err);
      });
    } catch (triggerErr) {
      console.warn('[enqueue] Failed to trigger background queue execution (exception):', triggerErr);
    }

    return res.status(200).json({
      ok: true,
      jobId,
      status: 'pending',
      queuePosition,
      estimatedWaitTime, // seconds
      priority,
      message: 'Job queued for processing'
    });
  } catch (dbErr) {
    console.error('Failed to create job:', dbErr);
    return safeErrorResponse(res, 500, 'JOB_CREATION_FAILED', 'Failed to queue job');
  }
}
