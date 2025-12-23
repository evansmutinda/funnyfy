import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
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

// Simple per-IP rate limit (requests per rolling minute)
const IP_RATE_LIMIT_PER_MINUTE = Number(process.env.IP_RATE_LIMIT_PER_MINUTE || 30);

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

// Helper to extract userId from JWT/auth token (placeholder - implement based on your auth system)
function extractUserIdFromAuth(authHeader: string): string | null {
  // TODO: Implement JWT verification and extract userId
  // For now, return null (requires proper implementation)
  return null;
}


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
  // In production, this should come from authenticated session/JWT
  const userId: string | null = 
    (req.headers['x-user-id'] as string) || 
    (req.headers['authorization'] && extractUserIdFromAuth(req.headers['authorization'] as string)) ||
    (body?.userId as string) || 
    null;

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
    const userResult = await query<{
      id: string;
      subscription_tier: string;
      subscription_status: string;
      trial_generations_used: number | null;
    }>(
      `
        SELECT id, subscription_tier, subscription_status, trial_generations_used
        FROM users
        WHERE id::text = $1
           OR revenuecat_user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found. Please sign up.'
      });
    }

    const user = userResult.rows[0];
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
    console.error('Failed to look up user:', userErr);
    return res.status(500).json({
      ok: false,
      error: 'Failed to verify user account'
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

        for (let attempt = 0; attempt < 15; attempt++) {
          if (terminalStatuses.has(prediction.status)) {
            break;
          }

          await sleep(2000);

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

    // Update job as completed, if we created one
    if (jobId) {
      const outputUrl = getImageUrlFromOutput((data as any)?.output);
      const replicateId = (data as any)?.id ?? null;

      try {
        await query(
          `
          UPDATE jobs
          SET status = $1,
              output_image_url = $2,
              replicate_prediction_id = $3,
              completed_at = NOW()
          WHERE id = $4
        `,
          ['completed', outputUrl, replicateId, jobId]
        );
      } catch (dbErr) {
        console.error('Failed to update job as completed:', dbErr);
      }
    }

    // Increment usage: trial users vs subscribed users
    if (isTrialUser) {
      // Increment trial_generations_used
      try {
        await query(
          `
            UPDATE users
            SET trial_generations_used = trial_generations_used + 1
            WHERE id = $1
          `,
          [userId]
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
          [userId, currentMonth]
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
