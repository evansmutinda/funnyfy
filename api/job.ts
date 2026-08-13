import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';
import { applyMiddleware } from './_utils/middleware';
import { requireAuth } from './_utils/auth';
import { safeErrorResponse } from './_utils/security';
import { getEstimatedWaitTime } from './_utils/queue-stats';
import { humanizeJobError } from './_utils/job-messages';
import { syncJobWithReplicate, type JobSyncRow } from './_utils/replicate-sync';
import { getContentPolicySource, isContentPolicyError } from './_utils/sightengine-moderation';
import { revokeUsageForJob } from './_utils/usage';
import {
  BLANK_OUTPUT_CODE,
  BLANK_OUTPUT_MESSAGE,
  blankOutputErrorMessage,
} from './_utils/output-validation';
import {
  STICKER_PACK_MAX,
  STICKER_PACK_MIN,
  STICKER_SHEET_STYLE_ID,
  buildTrayIcon,
  convertSheetCells,
  convertStickerItems,
  ensureJobSheetExpressionsColumn,
  getTelegramBotUsername,
  isStickerStyle,
  normalizeStickerExpressionIds,
  splitStickerSheet,
  validateStickerSheetExpressions,
  type StickerPackItem,
  type StickerPackItemInput,
} from './_utils/sticker-pack';
import { parseSheetExpressions } from './_utils/styles-config';

type JobPostBody = {
  action?: string;
  jobId?: string;
  reason?: string;
  title?: string;
  expressions?: string[];
  items?: StickerPackItemInput[];
};

function parseJobPostBody(req: VercelRequest): JobPostBody | null {
  try {
    if (typeof req.body === 'string') {
      return req.body ? (JSON.parse(req.body) as JobPostBody) : {};
    }
    return (req.body || {}) as JobPostBody;
  } catch {
    return null;
  }
}

function resolveJobAction(req: VercelRequest, body: JobPostBody): string {
  const queryAction = req.query?.action;
  const fromQuery = Array.isArray(queryAction) ? queryAction[0] : queryAction;
  return String(fromQuery || body.action || '').trim();
}

async function handleReportBadOutput(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  body: JobPostBody,
) {

  const jobId = body.jobId || (req.query.id as string) || (req.query.jobId as string);
  if (!jobId || typeof jobId !== 'string') {
    return safeErrorResponse(res, 400, 'MISSING_JOB_ID', 'jobId is required');
  }

  const jobResult = await query<{
    id: string;
    user_id: string | null;
    status: string;
    output_image_url: string | null;
  }>(
    `SELECT id, user_id, status, output_image_url FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    return safeErrorResponse(res, 404, 'JOB_NOT_FOUND', 'Job not found');
  }

  const job = jobResult.rows[0];
  if (job.user_id && job.user_id !== userId) {
    return safeErrorResponse(res, 403, 'FORBIDDEN', 'Forbidden');
  }

  if (job.status !== 'completed') {
    return res.status(200).json({
      ok: true,
      alreadyHandled: true,
      message: 'Job is not in completed state',
      status: job.status,
    });
  }

  const reason = String(body.reason || 'client_unloadable').slice(0, 120);
  await query(
    `
      UPDATE jobs
      SET status = 'failed',
          error_message = $1,
          completed_at = COALESCE(completed_at, NOW())
      WHERE id = $2 AND status = 'completed'
    `,
    [blankOutputErrorMessage(reason), jobId]
  );

  let revoked = false;
  if (job.user_id) {
    revoked = await revokeUsageForJob(jobId, job.user_id);
  }

  console.warn('[job] Reported blank/unloadable output', { jobId, reason, revoked });

  return res.status(200).json({
    ok: true,
    revoked,
    message: BLANK_OUTPUT_MESSAGE,
    error: BLANK_OUTPUT_CODE,
  });
}

async function packResponse(userId: string, title: string, stickers: StickerPackItem[]) {
  const tray = await buildTrayIcon(stickers[0].webpBase64);
  const telegramBot = await getTelegramBotUsername();
  return {
    ok: true,
    pack: {
      identifier: `funnyfy_${userId.slice(0, 8)}`,
      title,
      publisher: 'FunnyFy',
      trayIconWebpBase64: tray.webpBase64,
      stickers: stickers.map((sticker) => ({
        styleId: sticker.styleId,
        label: sticker.label,
        emoji: sticker.emoji,
        webpBase64: sticker.webpBase64,
        bytes: sticker.bytes,
      })),
      whatsapp: {
        minStickers: STICKER_PACK_MIN,
        maxStickers: STICKER_PACK_MAX,
        sizePx: 512,
        maxBytes: 100 * 1024,
      },
      telegram: telegramBot
        ? {
            botUsername: telegramBot,
            shareHint: 'Share the WebP stickers into Telegram, or message the FunnyFy bot to publish a pack.',
            botUrl: `https://t.me/${telegramBot}`,
          }
        : null,
    },
  };
}

async function handleCreateStickerPack(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  body: JobPostBody,
) {
  const title = String(body.title || 'FunnyFy Stickers').slice(0, 64);
  const jobId = String(body.jobId || '').trim();

  if (jobId) {
    await ensureJobSheetExpressionsColumn();
    const jobResult = await query<{
      id: string;
      user_id: string | null;
      style_id: string;
      status: string;
      output_image_url: string | null;
      sheet_expressions: string | null;
    }>(
      `
        SELECT id, user_id, style_id, status, output_image_url, sheet_expressions
        FROM jobs
        WHERE id = $1
      `,
      [jobId],
    );
    const job = jobResult.rows[0];
    if (!job) return safeErrorResponse(res, 404, 'JOB_NOT_FOUND', 'Job not found');
    if (job.user_id && job.user_id !== userId) {
      return safeErrorResponse(res, 403, 'FORBIDDEN', 'Forbidden');
    }
    if (job.style_id !== STICKER_SHEET_STYLE_ID) {
      return safeErrorResponse(res, 400, 'NOT_STICKER_SHEET', 'This job is not a sticker sheet.');
    }
    if (job.status !== 'completed' || !job.output_image_url) {
      return safeErrorResponse(res, 400, 'SHEET_NOT_READY', 'Wait for the sticker sheet to finish.');
    }

    let expressionIds = parseSheetExpressions(job.sheet_expressions);
    if (!expressionIds.length) {
      expressionIds = normalizeStickerExpressionIds(body.expressions);
    }
    const sheetError = validateStickerSheetExpressions(expressionIds);
    if (sheetError) {
      return safeErrorResponse(res, 400, 'INVALID_STICKER_SHEET', sheetError);
    }

    const sheetRes = await fetch(job.output_image_url);
    if (!sheetRes.ok) {
      return safeErrorResponse(res, 502, 'SHEET_DOWNLOAD_FAILED', 'Could not download the sticker sheet.');
    }
    const sheetBuffer = Buffer.from(await sheetRes.arrayBuffer());
    const cells = await splitStickerSheet(sheetBuffer, expressionIds.length);
    const stickers = await convertSheetCells(cells, expressionIds);
    return res.status(200).json(await packResponse(userId, title, stickers));
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length < 1) {
    return safeErrorResponse(res, 400, 'STICKER_PACK_EMPTY', 'Add at least one sticker.');
  }
  if (items.length > STICKER_PACK_MAX) {
    return safeErrorResponse(
      res,
      400,
      'STICKER_PACK_TOO_LARGE',
      `A pack can include at most ${STICKER_PACK_MAX} stickers.`,
    );
  }

  const normalized: StickerPackItemInput[] = [];
  for (const raw of items) {
    const styleId = String(raw?.styleId || '').trim();
    const imageUrl = String(raw?.imageUrl || '').trim();
    if (!styleId || !imageUrl) {
      return safeErrorResponse(res, 400, 'INVALID_STICKER_ITEM', 'Each sticker needs a styleId and imageUrl.');
    }
    if (!/^https?:\/\//i.test(imageUrl)) {
      return safeErrorResponse(res, 400, 'INVALID_STICKER_URL', 'Sticker images must be https URLs.');
    }
    if (!isStickerStyle(styleId)) {
      return safeErrorResponse(res, 400, 'INVALID_STICKER_STYLE', `${styleId} is not a sticker style.`);
    }
    normalized.push({ styleId, imageUrl });
  }

  const owned = await query<{ style_id: string }>(
    `
      SELECT DISTINCT style_id
      FROM jobs
      WHERE user_id = $1
        AND status = 'completed'
        AND style_id = ANY($2::text[])
        AND output_image_url IS NOT NULL
    `,
    [userId, normalized.map((item) => item.styleId)],
  );

  const ownedStyles = new Set(owned.rows.map((row) => row.style_id));
  for (const item of normalized) {
    if (!ownedStyles.has(item.styleId)) {
      return safeErrorResponse(
        res,
        403,
        'STICKER_NOT_OWNED',
        'Only your completed sticker generations can be added to a pack.',
      );
    }
  }

  const stickers = await convertStickerItems(normalized);
  return res.status(200).json(await packResponse(userId, title, stickers));
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyMiddleware(req, res, ['GET', 'POST', 'OPTIONS'])) return;

  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === 'POST') {
    const body = parseJobPostBody(req);
    if (!body) {
      return safeErrorResponse(res, 400, 'INVALID_JSON', 'Invalid JSON body');
    }
    const action = resolveJobAction(req, body);
    if (action === 'report-bad-output') {
      try {
        return await handleReportBadOutput(req, res, userId, body);
      } catch (err) {
        console.error('[job] report-bad-output failed:', err);
        return safeErrorResponse(res, 500, 'REPORT_FAILED', 'Failed to report bad output');
      }
    }
    if (action === 'create-sticker-pack') {
      try {
        return await handleCreateStickerPack(req, res, userId, body);
      } catch (err) {
        console.error('[job] create-sticker-pack failed:', err);
        const message = err instanceof Error ? err.message : 'Failed to create sticker pack';
        if (String(message).includes('INVALID_STICKER_STYLE')) {
          return safeErrorResponse(res, 400, 'INVALID_STICKER_STYLE', 'One or more styles are not stickers.');
        }
        return safeErrorResponse(res, 500, 'STICKER_PACK_FAILED', 'Failed to create sticker pack');
      }
    }
    return safeErrorResponse(res, 400, 'UNKNOWN_ACTION', 'Unknown action');
  }

  const jobId = (req.query.id || req.query.jobId) as string | undefined;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'jobId (or id) query parameter is required',
    });
  }

  try {
    const jobResult = await query<
      JobSyncRow & { priority: number; style_id: string; input_image_url: string | null }
    >(
      `
        SELECT
          id,
          user_id,
          style_id,
          status,
          priority,
          replicate_prediction_id,
          input_image_url,
          output_image_url,
          error_message,
          created_at,
          started_at,
          completed_at
        FROM jobs
        WHERE id = $1
      `,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Job not found' });
    }

    let job = jobResult.rows[0];

    if (job.user_id && job.user_id !== userId) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    if (
      job.status === 'processing' ||
      job.status === 'pending' ||
      (job.status === 'failed' &&
        job.replicate_prediction_id &&
        !job.output_image_url &&
        job.error_message &&
        (job.error_message.includes('JOB_STUCK') ||
          job.error_message.includes('Worker interrupted')))
    ) {
      const synced = await syncJobWithReplicate(job);
      if (synced) {
        job = { ...job, ...synced };
      }
    }

    let queuePosition: number | null = null;
    let estimatedWaitTime: number | null = null;

    if (job.status === 'pending') {
      try {
        const queueResult = await query<{ count: number }>(
          `
            SELECT COUNT(*)::int AS count
            FROM jobs
            WHERE status = 'pending'
              AND (
                priority > $1
                OR (priority = $1 AND created_at < $2)
              )
          `,
          [job.priority, job.created_at]
        );
        queuePosition = queueResult.rows[0]?.count ?? 0;
        estimatedWaitTime = await getEstimatedWaitTime(queuePosition ?? 0);
      } catch (queueErr) {
        console.error('[job] Failed to compute queue position:', queueErr);
        queuePosition = null;
        estimatedWaitTime = null;
      }
    }

    const userMessage = humanizeJobError(job.error_message);
    const contentPolicyBlocked =
      job.status === 'failed' && isContentPolicyError(job.error_message);
    const contentPolicySource = contentPolicyBlocked
      ? getContentPolicySource(job.error_message)
      : null;

    let infringementCount: number | null = null;
    if (contentPolicyBlocked) {
      try {
        const infResult = await query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM infringements WHERE user_id = $1`,
          [userId]
        );
        infringementCount = infResult.rows[0]?.count ?? 0;
      } catch (infErr) {
        console.error('[job] Failed to fetch infringement count:', infErr);
      }
    }

    const recoverable =
      job.status === 'processing' ||
      job.status === 'pending' ||
      (job.status === 'failed' &&
        Boolean(
          job.error_message &&
            (job.error_message.includes('JOB_STUCK') ||
              job.error_message.includes('Worker interrupted'))
        ));

    return res.status(200).json({
      ok: true,
      job: {
        id: job.id,
        styleId: job.style_id,
        status: job.status,
        priority: job.priority,
        inputImageUrl: job.input_image_url,
        outputImageUrl: job.output_image_url,
        errorMessage: job.error_message,
        userMessage,
        contentPolicyBlocked,
        contentPolicySource,
        infringementCount,
        recoverable,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        queuePosition,
        estimatedWaitTime,
      },
    });
  } catch (err: unknown) {
    console.error('[job] Failed to fetch job status:', err);
    return safeErrorResponse(res, 500, 'JOB_FETCH_FAILED', 'Failed to fetch job status');
  }
}
