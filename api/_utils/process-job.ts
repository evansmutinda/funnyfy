// Shared function to process a job with Replicate API
// Used by the async queue worker (api/cron/process-queue.ts)

import { query } from './db';
import { getStyleById } from './styles-config';
import {
  getImageUrlFromOutput,
  pollReplicatePrediction,
  saveReplicatePredictionId,
} from './replicate-sync';

const targetUrl = process.env.TARGET_API_URL;
const targetApiKey = process.env.TARGET_API_KEY;
const sightengineUser = process.env.SIGHTENGINE_API_USER;
const sightengineSecret = process.env.SIGHTENGINE_API_SECRET;
const NSFW_RAW_THRESHOLD = 0.3;
const INFRINGEMENT_BAN_THRESHOLD = 3;

export interface JobRow {
  id: string;
  user_id: string | null;
  style_id: string;
  input_image_url: string | null;
}

export async function processJob(job: JobRow): Promise<void> {
  if (!targetUrl) {
    throw new Error('TARGET_API_URL not configured');
  }

  const styleConfig = getStyleById(job.style_id);
  if (!styleConfig) {
    throw new Error(`Invalid styleId: ${job.style_id}`);
  }

  let prompt = styleConfig.prompt;
  const imageUrl = job.input_image_url;
  const modelVersion = styleConfig.model;

  const input: Record<string, unknown> = {
    prompt: prompt,
  };

  if (imageUrl) {
    if (modelVersion.includes('flux-kontext-pro') || modelVersion.includes('flux')) {
      input.input_image = imageUrl;
      input.aspect_ratio = 'match_input_image';
    } else if (modelVersion.includes('nano-banana')) {
      input.image_input = [imageUrl];
      input.image = imageUrl;
      input.image_url = imageUrl;
      if (
        !prompt.toLowerCase().includes('uploaded') &&
        !prompt.toLowerCase().includes('photo') &&
        !prompt.toLowerCase().includes('image') &&
        !prompt.toLowerCase().includes('reference') &&
        !prompt.toLowerCase().includes('provided')
      ) {
        prompt = `Using the uploaded image as reference: ${prompt}`;
        input.prompt = prompt;
      }
    } else if (modelVersion.includes('seedream')) {
      input.image_input = [imageUrl];
      input.aspect_ratio = 'match_input_image';
      input.sequential_image_generation = 'disabled';
      input.max_images = 1;
    } else {
      input.input_image = imageUrl;
    }
  }

  const upstreamBody = {
    version: modelVersion,
    input: input,
  };

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
        const nudity = (modData as { nudity?: { raw?: number } })?.nudity;

        if (nudity && typeof nudity.raw === 'number' && nudity.raw >= NSFW_RAW_THRESHOLD) {
          if (job.user_id) {
            try {
              await query(
                `INSERT INTO infringements (user_id, infringement_type, details)
                 VALUES ($1, 'nsfw', $2)`,
                [job.user_id, JSON.stringify({ raw: nudity.raw })]
              );
              const countResult = await query<{ count: string }>(
                `SELECT COUNT(*)::text AS count FROM infringements WHERE user_id = $1`,
                [job.user_id]
              );
              const infCount = parseInt(countResult.rows[0]?.count ?? '0', 10);
              if (infCount >= INFRINGEMENT_BAN_THRESHOLD) {
                await query(`UPDATE users SET banned_at = NOW() WHERE id = $1`, [job.user_id]);
              }
            } catch (infErr) {
              console.error('[process-job] Failed to record NSFW infringement:', infErr);
            }
          }
          await query(
            `UPDATE jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`,
            ['CONTENT_NOT_ALLOWED: Image failed NSFW moderation', job.id]
          );
          throw new Error('CONTENT_NOT_ALLOWED');
        }
      }
    } catch (modErr: unknown) {
      if (modErr instanceof Error && modErr.message === 'CONTENT_NOT_ALLOWED') throw modErr;
      console.warn('[process-job] Sightengine check failed (proceeding):', modErr);
    }
  }

  const fetchRes = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(targetApiKey ? { Authorization: `Token ${targetApiKey}` } : {}),
    },
    body: JSON.stringify(upstreamBody),
  });

  let data = (await fetchRes.json().catch(() => ({ error: 'Non-JSON response from target API' }))) as Record<
    string,
    unknown
  >;

  if (!fetchRes.ok) {
    const errorMsg = typeof data === 'object' ? JSON.stringify(data) : String(data);
    await query(
      `UPDATE jobs SET status = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
      ['failed', errorMsg, job.id]
    );
    throw new Error(`Replicate API error: ${errorMsg}`);
  }

  const initialPredictionId = typeof data.id === 'string' ? data.id : null;
  if (initialPredictionId) {
    await saveReplicatePredictionId(job.id, initialPredictionId);
  }

  try {
    data = await pollReplicatePrediction(data, 30, 2000);
  } catch (pollErr) {
    console.error('[process-job] Replicate poll error:', pollErr);
    throw new Error('JOB_STUCK: Worker interrupted while waiting for Replicate');
  }

  const replicateStatus = String(data.status || '');
  const outputUrl = getImageUrlFromOutput(data.output);
  const replicateId = typeof data.id === 'string' ? data.id : initialPredictionId;
  const replicateError = data.error ?? data.logs ?? null;

  if (replicateStatus === 'succeeded' && outputUrl) {
    await query(
      `UPDATE jobs SET status = $1, output_image_url = $2, replicate_prediction_id = $3,
       error_message = NULL, completed_at = NOW() WHERE id = $4`,
      ['completed', outputUrl, replicateId, job.id]
    );
    return;
  }

  if (replicateStatus === 'processing' || replicateStatus === 'starting') {
    throw new Error('JOB_STUCK: Worker interrupted while Replicate is still processing');
  }

  const errorMsg =
    replicateStatus === 'failed' || replicateStatus === 'canceled'
      ? `Replicate ${replicateStatus}: ${replicateError || 'No details'}`
      : outputUrl
        ? null
        : 'Replicate did not return an image';

  await query(
    `UPDATE jobs SET status = 'failed', output_image_url = NULL,
     replicate_prediction_id = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
    [replicateId, errorMsg || 'Generation failed', job.id]
  );
  throw new Error(errorMsg || 'Replicate generation failed');
}
