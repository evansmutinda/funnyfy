// ============================================================
// DEPRECATED: This endpoint is no longer used by the mobile app.
// The mobile app now uses /api/enqueue (async) + /api/job (poll).
// This file is kept for reference only and is permanently disabled.
// ============================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';
import { extractUserId } from './utils/security';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const sightengineUser = process.env.SIGHTENGINE_API_USER;
const sightengineSecret = process.env.SIGHTENGINE_API_SECRET;
const NSFW_RAW_THRESHOLD = 0.3;
const INFRINGEMENT_BAN_THRESHOLD = 3; // Ban after this many infringements
const targetUrl = process.env.TARGET_API_URL;
const targetApiKey = process.env.TARGET_API_KEY;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Very simple helper to extract an image URL from Replicate output
function getImageUrlFromOutput(output: any): string | null {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && typeof first.url === 'string') {
      return first.url;
    }
  }
  if (output && typeof output === 'object' && typeof (output as any).url === 'string') {
    return (output as any).url;
  }
  return null;
}

// Burst protection: 60 requests per minute (prevents abuse, allows normal usage)
// Users are primarily limited by monthly quota, not rate limits
const IP_RATE_LIMIT_PER_MINUTE = Number(process.env.IP_RATE_LIMIT_PER_MINUTE || 60);

// Subscription tier quotas (per month)
const TIER_QUOTAS: Record<string, number> = {
  'starter': 50,
  'popular': 100,
  'pro': 250,
};

function getQuotaForTier(tier: string | null): number {
  if (!tier) {
    throw new Error('User tier is required');
  }
  return TIER_QUOTAS[tier.toLowerCase()] || 0;
}

function getCurrentMonthDate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function getClientIp(req: VercelRequest): string {
  const xfwd = (req.headers['x-forwarded-for'] || '') as string;
  if (xfwd) {
    return xfwd.split(',')[0].trim();
  }
  return (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'unknown';
}

function getCurrentMinuteWindow(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString();
}


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // This endpoint is permanently disabled. Use /api/enqueue + /api/job instead.
  return res.status(410).json({
    ok: false,
    error: 'ENDPOINT_DEPRECATED',
    message: 'This endpoint has been retired. Please update your client to use /api/enqueue and /api/job.',
  });

  // ---- All code below is retained for reference only ----
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Only POST allowed' });
  }

  if (!targetUrl) {
    return res
      .status(500)
      .json({ ok: false, error: 'TARGET_API_URL not configured' });
  }

  let body: Record<string, unknown> = {};
  try {
    if (typeof req.body === 'string') {
      body = req.body ? JSON.parse(req.body) : {};
    } else if (req.body) {
      body = req.body as Record<string, unknown>;
    }
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  const payload = (body?.payload as Record<string, unknown>) ?? {};

  // Import styles configuration from shared file
  const { getStyleById } = await import('./styles-config');

  // Adapt payload shape for Replicate API
  // Mobile app must send: { payload: { styleId: string, imageUrl?: string } }
  // Prompts are protected on server - only styleId is accepted
  const styleId = typeof (payload as any)?.styleId === 'string' 
    ? (payload as any).styleId 
    : null;
  
  // Validate styleId is provided
  if (!styleId) {
    return res.status(400).json({
      ok: false,
      error: 'styleId is required. Prompts are protected on the server.'
    });
  }
  
  // Get style config from shared file (prompts protected on server)
  const styleConfig = getStyleById(styleId);
  
  // Validate style exists
  if (!styleConfig) {
    return res.status(400).json({
      ok: false,
      error: `Invalid styleId: ${styleId}`
    });
  }
  
  // Use protected prompt from server config (never from client)
  let prompt = styleConfig.prompt;
  const imageUrl = typeof (payload as any)?.imageUrl === 'string'
    ? (payload as any).imageUrl
    : null;

  // --- Image upload validation ---
  // Validates uploaded images (base64 data URLs) to prevent abuse:
  // 1. MIME type must be image/jpeg, image/png, or image/webp
  // 2. Size must be under 10 MB (after base64 decode)
  // 3. Reject empty or malformed data
  if (imageUrl && imageUrl.startsWith('data:')) {
    const dataUrlMatch = imageUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_IMAGE_FORMAT',
        message: 'Image must be a valid base64 data URL.',
      });
    }

    const mimeType = dataUrlMatch[1].toLowerCase();
    const base64Data = dataUrlMatch[2];

    // Allow-list of acceptable MIME types
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({
        ok: false,
        error: 'UNSUPPORTED_IMAGE_TYPE',
        message: 'Only JPEG, PNG, and WebP images are supported.',
      });
    }

    // Check size (10 MB max after base64 decode)
    // base64 inflates size by ~33%, so 10MB binary ≈ 13.3MB base64 string
    const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    const approxBinarySize = (base64Data.length * 3) / 4;
    if (approxBinarySize > MAX_IMAGE_SIZE_BYTES) {
      return res.status(413).json({
        ok: false,
        error: 'IMAGE_TOO_LARGE',
        message: 'Image must be smaller than 10 MB. Please use a smaller photo.',
      });
    }

    // Reject empty data
    if (base64Data.length < 100) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_IMAGE_DATA',
        message: 'Image data is empty or too small to be valid.',
      });
    }

    // Verify magic bytes match the declared MIME type (prevents spoofing)
    try {
      const headerBytes = Buffer.from(base64Data.slice(0, 32), 'base64');
      const isValidImage =
        // JPEG: FF D8 FF
        (headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff) ||
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        (headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47) ||
        // WebP: RIFF ... WEBP (52 49 46 46 ... 57 45 42 50)
        (headerBytes[0] === 0x52 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46 && headerBytes[3] === 0x46 &&
         headerBytes[8] === 0x57 && headerBytes[9] === 0x45 && headerBytes[10] === 0x42 && headerBytes[11] === 0x50);

      if (!isValidImage) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_IMAGE_SIGNATURE',
          message: 'Image data does not match a supported image format.',
        });
      }
    } catch (sigErr) {
      console.warn('[test] Image signature check failed (non-fatal):', sigErr);
      // Continue — the MIME type check above already filtered most bad inputs
    }
  } else if (imageUrl && !imageUrl.startsWith('http')) {
    // Reject non-HTTP, non-data-URL inputs (e.g. file://, javascript:, etc.)
    return res.status(400).json({
      ok: false,
      error: 'INVALID_IMAGE_URL',
      message: 'Image URL must be HTTPS or a base64 data URL.',
    });
  }

  // Get model from style config
  const modelVersion = styleConfig.model;

  const input: Record<string, unknown> = {
    prompt: prompt // Always use protected server prompt
  };

  // Add image if provided
  // Different models may use different parameter names
  if (imageUrl) {
    // For flux-kontext-pro and similar models
    if (modelVersion.includes('flux-kontext-pro') || modelVersion.includes('flux')) {
      input.input_image = imageUrl;
      input.aspect_ratio = 'match_input_image';
    } 
    // For nano-banana - try multiple parameter formats
    else if (modelVersion.includes('nano-banana')) {
      // nano-banana may use 'image_input' as array, or 'image', or 'image_url'
      // Try image_input as array first (based on Replicate docs)
      input.image_input = [imageUrl];
      // Also include as single value in case it accepts both formats
      input.image = imageUrl;
      input.image_url = imageUrl;
      // Ensure prompt explicitly references using the uploaded image
      if (!prompt.toLowerCase().includes('uploaded') && !prompt.toLowerCase().includes('photo') && !prompt.toLowerCase().includes('image') && !prompt.toLowerCase().includes('reference') && !prompt.toLowerCase().includes('provided')) {
        prompt = `Using the uploaded image as reference: ${prompt}`;
        input.prompt = prompt;
      }
    }
    // Default fallback for other models
    else {
      input.input_image = imageUrl;
    }
  }

  const upstreamBody = {
    version: modelVersion,
    input: input
  };

  // User authentication required - no anonymous access
  // Uses secure extraction helper (JWT in production, fallback in dev)
  const userId = extractUserId(req);

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'User authentication required. Please sign in to continue.'
    });
  }

  // --- Look up user tier and trial status (required) ---
  let dbUserId: string | null = null;
  let userTier: string | null = null;
  let subscriptionStatus: string | null = null;
  let trialGenerationsUsed: number = 0;
  const TRIAL_LIMIT = 3;

  try {
    type UserRow = {
      id: string;
      subscription_tier: string;
      subscription_status: string;
      trial_generations_used: number | null;
      banned_at?: string | null;
    };

    let userResult: { rows: UserRow[] };

    // Try full query first, then fallback without banned_at, then minimal (if schema mismatch)
    const queries: Array<{ sql: string; hasTier: boolean }> = [
      { sql: `SELECT id, subscription_tier, subscription_status, trial_generations_used, banned_at
              FROM users WHERE id::text = $1 OR revenuecat_user_id = $1 ORDER BY created_at DESC LIMIT 1`, hasTier: true },
      { sql: `SELECT id, subscription_tier, subscription_status, trial_generations_used
              FROM users WHERE id::text = $1 OR revenuecat_user_id = $1 ORDER BY created_at DESC LIMIT 1`, hasTier: true },
      { sql: `SELECT id FROM users WHERE id::text = $1 OR revenuecat_user_id = $1 ORDER BY created_at DESC LIMIT 1`, hasTier: false },
    ];

    let lastErr: any;
    let usedMinimal = false;
    for (const { sql, hasTier } of queries) {
      try {
        userResult = await query<UserRow>(sql, [userId]);
        usedMinimal = !hasTier;
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || err);
        if (msg.includes('does not exist') || msg.includes('banned_at') || msg.includes('relation')) continue;
        throw err;
      }
    }

    if (lastErr || !userResult!) {
      throw lastErr || new Error('User lookup failed');
    }

    if (usedMinimal && userResult.rows.length > 0) {
      return res.status(500).json({
        ok: false,
        error: 'SCHEMA_UPDATE_REQUIRED',
        message: 'Database schema is outdated. Run migrations (migrations-infringements.sql and base schema) in Supabase SQL Editor.',
      });
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found. Please sign up.'
      });
    }

    const user = userResult.rows[0];

    if (user.banned_at) {
      return res.status(403).json({
        ok: false,
        error: 'ACCOUNT_BANNED',
        message: 'Your account has been suspended due to policy violations. Please contact support if you believe this is an error.'
      });
    }
    dbUserId = user.id;
    subscriptionStatus = user.subscription_status;
    userTier = user.subscription_tier;
    trialGenerationsUsed = user.trial_generations_used ?? 0;

    // Check if user is in trial and has remaining free generations
    if (subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT)) {
      // User is in trial - check if they've used all 3 free generations
      if (trialGenerationsUsed >= TRIAL_LIMIT) {
        return res.status(403).json({
          ok: false,
          error: 'TRIAL_EXPIRED',
          message: 'You\'ve used all 3 free trial generations. Please subscribe to continue.',
          trialUsed: trialGenerationsUsed,
          trialLimit: TRIAL_LIMIT
        });
      }
      // Trial user with remaining generations - allow this request
      // We'll increment trial_generations_used after successful generation
    } else if (subscriptionStatus !== 'active') {
      // Not in trial and not active subscription
      return res.status(403).json({
        ok: false,
        error: 'SUBSCRIPTION_INACTIVE',
        message: 'Your subscription is not active. Please subscribe to continue.'
      });
    }
  } catch (userErr) {
    const err = userErr as Error;
    console.error('[test] User lookup failed:', err?.message || err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to verify user account',
      message: 'Database error during user lookup. Check Vercel logs for details.',
    });
  }

  if (!userTier || !dbUserId) {
    return res.status(400).json({
    ok: false,
    error: 'INVALID_SUBSCRIPTION_TIER',
    message: 'User subscription is not configured correctly.'
    });
  }

  // --- Per-IP rate limiting (simple 1-minute window) ---
  const clientIp = getClientIp(req);
  const windowStart = getCurrentMinuteWindow();

  try {
    const rateResult = await query<{ id: string; request_count: number }>(
      `
        SELECT id, request_count
        FROM rate_limits
        WHERE identifier = $1
          AND type = 'ip'
          AND window_start = $2
      `,
      [clientIp, windowStart]
    );

    let currentCount = 0;

    if (rateResult.rows.length === 0) {
      const insertRate = await query<{ id: string }>(
        `
          INSERT INTO rate_limits (identifier, type, window_start, request_count)
          VALUES ($1, 'ip', $2, 1)
          RETURNING id
        `,
        [clientIp, windowStart]
      );
      currentCount = 1;
    } else {
      currentCount = (rateResult.rows[0].request_count ?? 0) + 1;
      await query(
        `
          UPDATE rate_limits
          SET request_count = $1
          WHERE id = $2
        `,
        [currentCount, rateResult.rows[0].id]
      );
    }

    if (currentCount > IP_RATE_LIMIT_PER_MINUTE) {
      return res.status(429).json({
        ok: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please wait a moment and try again.',
      });
    }
  } catch (rateErr) {
    console.error('IP rate limit check failed (continuing without limit):', rateErr);
    // Do not block generation on rate limit DB issues (for now)
  }

  // --- Quota check: trial users vs subscribed users ---
  const isTrialUser = subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);
  
  if (isTrialUser) {
    // Trial user: check trial_generations_used (max 3)
    if (trialGenerationsUsed >= TRIAL_LIMIT) {
      return res.status(403).json({
        ok: false,
        error: 'TRIAL_EXPIRED',
        message: 'You\'ve used all 3 free trial generations. Please subscribe to continue.',
        trialUsed: trialGenerationsUsed,
        trialLimit: TRIAL_LIMIT
      });
    }
    } else {
      // Subscribed user: check monthly quota
      const currentMonth = getCurrentMonthDate();
      const quotaLimit = getQuotaForTier(userTier);
      let usageRowId: string | null = null;
      let currentCount = 0;

      try {
        const usageResult = await query<{ id: string; count: number }>(
          `
            SELECT id, count
            FROM usage_tracking
            WHERE user_id = $1 AND month = $2
          `,
          [dbUserId, currentMonth]
        );

        if (usageResult.rows.length === 0) {
          const insertUsage = await query<{ id: string }>(
            `
              INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
              VALUES ($1, $2, 0, NOW())
              RETURNING id
            `,
            [dbUserId, currentMonth]
          );
          usageRowId = insertUsage.rows[0]?.id ?? null;
        } else {
          usageRowId = usageResult.rows[0].id;
          currentCount = usageResult.rows[0].count ?? 0;
        }

        if (currentCount >= quotaLimit) {
          // Apply pending_tier on usage depletion (tier change takes effect when quota exhausted)
          try {
            const pendResult = await query<{ id: string; pending_tier: string }>(
              `SELECT id, pending_tier FROM subscriptions WHERE user_id = $1 AND status = 'active' AND pending_tier IS NOT NULL LIMIT 1`,
              [dbUserId]
            );
            if (pendResult.rows.length > 0 && pendResult.rows[0].pending_tier) {
              const pt = pendResult.rows[0].pending_tier;
              await query(`UPDATE subscriptions SET tier = $1, pending_tier = NULL, updated_at = NOW() WHERE id = $2`, [pt, pendResult.rows[0].id]);
              await query(`UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2`, [pt, dbUserId]);
            }
          } catch (_) { /* ignore */ }
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
        return res.status(500).json({
          ok: false,
          error: 'Failed to check usage quota'
        });
      }
    }

  // --- Sightengine NSFW moderation (before Replicate) ---
  if (imageUrl && sightengineUser && sightengineSecret) {
    try {
      const base64Match = imageUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        const buffer = Buffer.from(base64Match[1], 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        const form = new FormData();
        form.append('media', blob, 'image.jpg');
        form.append('models', 'nudity');
        form.append('api_user', sightengineUser);
        form.append('api_secret', sightengineSecret);

        const modRes = await fetch('https://api.sightengine.com/1.0/check.json', {
          method: 'POST',
          body: form,
        });

        const modData = await modRes.json().catch(() => ({}));
        const nudity = (modData as any)?.nudity;
        if (nudity && typeof nudity.raw === 'number' && nudity.raw >= NSFW_RAW_THRESHOLD) {
          if (dbUserId) {
            try {
              await query(
                `INSERT INTO infringements (user_id, infringement_type, details)
                 VALUES ($1, 'nsfw', $2)`,
                [dbUserId, JSON.stringify({ raw: nudity.raw, partial: nudity.partial })]
              );
              const countResult = await query<{ count: string }>(
                `SELECT COUNT(*)::text as count FROM infringements WHERE user_id = $1`,
                [dbUserId]
              );
              const infringementCount = parseInt(countResult.rows[0]?.count ?? '0', 10);
              if (infringementCount >= INFRINGEMENT_BAN_THRESHOLD) {
                await query(
                  `UPDATE users SET banned_at = NOW() WHERE id = $1`,
                  [dbUserId]
                );
                return res.status(403).json({
                  ok: false,
                  error: 'ACCOUNT_BANNED',
                  message: 'Your account has been suspended due to repeated policy violations. Please contact support if you believe this is an error.'
                });
              }
            } catch (infErr) {
              console.error('[Infringements] Failed to record or check:', infErr);
            }
          }
          return res.status(400).json({
            ok: false,
            error: 'CONTENT_NOT_ALLOWED',
            message: 'This image cannot be processed. Please use an appropriate photo.',
          });
        }
      }
    } catch (modErr) {
      console.error('[Sightengine] Moderation check failed (proceeding):', modErr);
      // Fail open: if Sightengine fails, allow the request (availability over strict filtering)
    }
  }

  // Determine priority based on tier (Pro=10, Popular=5, Starter=1)
  const priority = userTier === 'pro' ? 10 : userTier === 'popular' ? 5 : 1;

  // Create a job record before calling Replicate
  let jobId: string | null = null;
  try {
    const insertResult = await query<{ id: string }>(
      `
      INSERT INTO jobs (user_id, style_id, status, priority, input_image_url, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `,
      [dbUserId, styleId, 'processing', priority, imageUrl]
    );
    jobId = insertResult.rows[0]?.id ?? null;
  } catch (dbErr) {
    console.error('Failed to insert job record:', dbErr);
    // We don't fail the whole request here; just continue without job tracking.
  }

  try {
    const fetchRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Replicate API uses Authorization Token (not Bearer)
        ...(targetApiKey ? { 'Authorization': `Token ${targetApiKey}` } : {})
      },
      body: JSON.stringify(upstreamBody)
    });

    let data = await fetchRes
      .json()
      .catch(() => ({ error: 'Non-JSON response from target API' }));

    if (!fetchRes.ok) {
      // Log full error details for debugging (server-side only)
      console.error('Replicate API Error:', {
        status: fetchRes.status,
        statusText: fetchRes.statusText,
        url: targetUrl,
        requestBody: upstreamBody,
        responseData: data
      });

      // Update job as failed, if we created one
      if (jobId) {
        try {
          await query(
            `
            UPDATE jobs
            SET status = $1,
                error_message = $2,
                completed_at = NOW()
            WHERE id = $3
          `,
            [
              'failed',
              typeof data === 'object' ? JSON.stringify(data) : String(data),
              jobId
            ]
          );
        } catch (dbErr) {
          console.error('Failed to update job as failed:', dbErr);
        }
      }

      // Return generic error to client (don't expose internal details)
      const statusCode = fetchRes.status >= 500 ? 500 : 400;
      return res.status(statusCode).json({
        ok: false,
        error: 'Image processing failed. Please try again.'
      });
    }

    // Poll Replicate until the prediction finishes so the client
    // receives a completed job (with output if available).
    try {
      const terminalStatuses = new Set(['succeeded', 'failed', 'canceled']);
      let prediction: any = data;

      if (prediction?.urls?.get && prediction?.id) {
        const statusUrl: string = prediction.urls.get;

        // Poll up to ~50s (25 attempts × 2s) — stays under Vercel's 60s function timeout
        // Most generations complete in 10-30s; heavy load/complex styles may take 40-50s
        const MAX_POLL_ATTEMPTS = 25;
        const POLL_INTERVAL_MS = 2000;

        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
          if (terminalStatuses.has(prediction.status)) {
            break;
          }

          await sleep(POLL_INTERVAL_MS);

          const statusRes = await fetch(statusUrl, {
            headers: {
              'Content-Type': 'application/json',
              ...(targetApiKey ? { Authorization: `Token ${targetApiKey}` } : {})
            }
          });

          const statusData = await statusRes
            .json()
            .catch(() => ({ error: 'Non-JSON response from target API' }));

          if (!statusRes.ok) {
            // Log full error details for debugging (server-side only)
            console.error('Replicate status poll error:', {
              status: statusRes.status,
              data: statusData
            });
            break;
          }

          prediction = statusData;
        }
      }

      data = prediction;
    } catch (pollErr) {
      console.error('Error while polling Replicate status:', pollErr);
      // Fall back to returning the initial prediction if polling fails.
    }

    // Update job based on Replicate status (succeeded vs failed/canceled)
    const replicateStatus = (data as any)?.status;
    const outputUrl = getImageUrlFromOutput((data as any)?.output);
    const replicateId = (data as any)?.id ?? null;
    const replicateError = (data as any)?.error ?? (data as any)?.logs ?? null;
    const replicateFailed = replicateStatus === 'failed' || replicateStatus === 'canceled' || !(replicateStatus === 'succeeded' && outputUrl);

    if (jobId) {
      try {
        if (!replicateFailed) {
          await query(
            `
            UPDATE jobs
            SET status = 'completed',
                output_image_url = $1,
                replicate_prediction_id = $2,
                error_message = NULL,
                completed_at = NOW()
            WHERE id = $3
          `,
            [outputUrl, replicateId, jobId]
          );
        } else {
          const errorMsg = replicateStatus === 'failed' || replicateStatus === 'canceled'
            ? `Replicate ${replicateStatus}: ${replicateError || 'No details'}`
            : (outputUrl ? null : 'Replicate did not return an image');
          await query(
            `
            UPDATE jobs
            SET status = 'failed',
                output_image_url = NULL,
                replicate_prediction_id = $1,
                error_message = $2,
                completed_at = NOW()
            WHERE id = $3
          `,
            [replicateId, errorMsg || 'Generation failed', jobId]
          );
        }
      } catch (dbErr) {
        console.error('Failed to update job status:', dbErr);
      }
    }

    // If Replicate failed, return error to client (do not increment usage)
    if (replicateFailed) {
      // For "processing" status: prediction is still running on Replicate's side
      // The user paid for compute, so let them know to check back via gallery
      const userMsg = replicateStatus === 'failed' || replicateStatus === 'canceled'
        ? 'Image generation failed. Please try again.'
        : replicateStatus === 'processing' || replicateStatus === 'starting'
          ? 'Generation is taking longer than expected. Your image will appear in My Caricatures when ready.'
          : 'Image generation did not complete. Please try again.';
      return res.status(400).json({
        ok: false,
        error: userMsg,
        replicateStatus: replicateStatus || 'unknown',
        // Include the prediction ID so the client could poll later if we add that feature
        replicateId: replicateId,
      });
    }

    // Increment usage: trial users vs subscribed users (only on success)
    if (isTrialUser) {
      // Increment trial_generations_used
      try {
        await query(
          `
            UPDATE users
            SET trial_generations_used = trial_generations_used + 1
            WHERE id = $1
          `,
          [dbUserId]
        );
      } catch (trialUpdateErr) {
        console.error('Failed to increment trial usage:', trialUpdateErr);
      }
    } else {
      // Increment monthly usage count
      const currentMonth = getCurrentMonthDate();
      try {
        await query(
          `
            UPDATE usage_tracking
            SET count = count + 1
            WHERE user_id = $1 AND month = $2
          `,
          [dbUserId, currentMonth]
        );
      } catch (usageUpdateErr) {
        console.error('Failed to increment usage count:', usageUpdateErr);
      }
    }

    return res.status(200).json({
      ok: true,
      status: fetchRes.status,
      data
    });
  } catch (err: any) {
    // Log full error details for debugging (server-side only)
    console.error('Upstream API call failed:', err);

    // Update job as failed, if we created one
    if (jobId) {
      try {
        await query(
          `
          UPDATE jobs
          SET status = $1,
              error_message = $2,
              completed_at = NOW()
          WHERE id = $3
        `,
          ['failed', String(err?.message || err), jobId]
        );
      } catch (dbErr) {
        console.error('Failed to update job as failed (exception path):', dbErr);
      }
    }

    // Return generic error to client (don't expose internal details)
    return res
      .status(500)
      .json({ ok: false, error: 'Image processing service unavailable. Please try again later.' });
  }
}
