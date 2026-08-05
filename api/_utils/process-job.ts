// Shared function to process a job with Replicate API
// Used by the async queue worker (api/cron/process-queue.ts)

import { query } from './db';
import { getStyleById, resolveStyleModel, resolveStyleReferenceUrl } from './styles-config';
import {
  getImageUrlFromOutput,
  pollReplicatePrediction,
  saveReplicatePredictionId,
} from './replicate-sync';
import {
  checkImageWithSightengine,
  CONTENT_NOT_ALLOWED_CODE,
  handleContentPolicyViolation,
  isReplicateContentPolicyError,
  normalizeGenerationErrorMessage,
} from './sightengine-moderation';
import { finalizeJobCost } from './job-cost';
import {
  GENERATION_UNAVAILABLE_CODE,
  isReplicateBillingError,
  pauseQueueForReplicateBilling,
} from './queue-pause';
import {
  blankOutputErrorMessage,
  BLANK_OUTPUT_CODE,
  validateOutputImageUrl,
} from './output-validation';

const targetUrl = process.env.TARGET_API_URL;
const targetApiKey = process.env.TARGET_API_KEY;
const sightengineUser = process.env.SIGHTENGINE_API_USER;
const sightengineSecret = process.env.SIGHTENGINE_API_SECRET;

/** Replicate models that accept output_format (flux, nano-banana, seedream). */
const REPLICATE_OUTPUT_FORMAT = 'png';

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
  const modelVersion = resolveStyleModel(styleConfig);
  const referenceUrl = resolveStyleReferenceUrl(styleConfig);

  // Persist chosen model early so cost finalization uses the actual run, not the primary.
  await query(`UPDATE jobs SET model_version = $1 WHERE id = $2`, [modelVersion, job.id]);

  const input: Record<string, unknown> = {
    prompt: prompt,
  };

  if (imageUrl) {
    if (modelVersion.includes('flux-kontext-pro') || modelVersion.includes('flux')) {
      // Flux Kontext accepts a single input image — prefer the user photo.
      input.input_image = imageUrl;
      input.aspect_ratio = 'match_input_image';
      if (referenceUrl) {
        console.warn(
          `[process-job] Style ${job.style_id} has referenceImage but model ${modelVersion} is single-image; using user photo only`
        );
      }
    } else if (modelVersion.includes('nano-banana')) {
      // Dual-image styles: [style template, user photo] — prompt refers to 1st / 2nd pic.
      input.image_input = referenceUrl ? [referenceUrl, imageUrl] : [imageUrl];
      input.image = imageUrl;
      input.image_url = imageUrl;
      if (
        !referenceUrl &&
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
      input.image_input = referenceUrl ? [referenceUrl, imageUrl] : [imageUrl];
      input.aspect_ratio = 'match_input_image';
      input.sequential_image_generation = 'disabled';
      input.max_images = 1;
    } else {
      input.input_image = imageUrl;
    }

    if (
      modelVersion.includes('flux') ||
      modelVersion.includes('nano-banana') ||
      modelVersion.includes('seedream')
    ) {
      input.output_format = REPLICATE_OUTPUT_FORMAT;
    }
  }

  const upstreamBody = {
    version: modelVersion,
    input: input,
  };

  if (imageUrl && sightengineUser && sightengineSecret) {
    try {
      const moderation = await checkImageWithSightengine(imageUrl, sightengineUser, sightengineSecret);
      if (moderation && !moderation.allowed) {
        await handleContentPolicyViolation(job.id, job.user_id, {
          source: 'sightengine',
          violations: moderation.violations,
        });
        throw new Error(CONTENT_NOT_ALLOWED_CODE);
      }
    } catch (modErr: unknown) {
      if (modErr instanceof Error && modErr.message === CONTENT_NOT_ALLOWED_CODE) throw modErr;
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
    if (isReplicateContentPolicyError(errorMsg)) {
      await handleContentPolicyViolation(job.id, job.user_id, {
        source: 'replicate',
        error: errorMsg.slice(0, 500),
      });
      throw new Error(CONTENT_NOT_ALLOWED_CODE);
    }
    if (fetchRes.status === 402 || isReplicateBillingError(errorMsg)) {
      await pauseQueueForReplicateBilling(errorMsg, 'replicate_create');
      await query(
        `UPDATE jobs SET status = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
        ['failed', `${GENERATION_UNAVAILABLE_CODE}: ${errorMsg}`.slice(0, 1000), job.id]
      );
      await finalizeJobCost(job.id, job.style_id, 'failed');
      throw new Error(GENERATION_UNAVAILABLE_CODE);
    }
    await query(
      `UPDATE jobs SET status = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
      ['failed', errorMsg, job.id]
    );
    await finalizeJobCost(job.id, job.style_id, 'failed');
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
    const validation = await validateOutputImageUrl(outputUrl);
    if (!validation.ok) {
      console.warn('[process-job] Output failed validation:', validation);
      await query(
        `UPDATE jobs SET status = 'failed', output_image_url = NULL,
         replicate_prediction_id = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
        [replicateId, blankOutputErrorMessage(validation.reason), job.id]
      );
      await finalizeJobCost(job.id, job.style_id, 'failed');
      throw new Error(BLANK_OUTPUT_CODE);
    }

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

  let errorMsg =
    replicateStatus === 'failed' || replicateStatus === 'canceled'
      ? `Replicate ${replicateStatus}: ${replicateError || 'No details'}`
      : outputUrl
        ? null
        : 'Replicate did not return an image';

  if (errorMsg && isReplicateContentPolicyError(errorMsg)) {
    await handleContentPolicyViolation(job.id, job.user_id, {
      source: 'replicate',
      error: errorMsg.slice(0, 500),
    });
    throw new Error(CONTENT_NOT_ALLOWED_CODE);
  }

  if (errorMsg && isReplicateBillingError(errorMsg)) {
    await pauseQueueForReplicateBilling(errorMsg, 'replicate_prediction');
    await query(
      `UPDATE jobs SET status = 'failed', output_image_url = NULL,
       replicate_prediction_id = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
      [replicateId, `${GENERATION_UNAVAILABLE_CODE}: ${errorMsg}`.slice(0, 1000), job.id]
    );
    await finalizeJobCost(job.id, job.style_id, 'failed');
    throw new Error(GENERATION_UNAVAILABLE_CODE);
  }

  if (errorMsg) {
    errorMsg = normalizeGenerationErrorMessage(errorMsg);
  }

  await query(
    `UPDATE jobs SET status = 'failed', output_image_url = NULL,
     replicate_prediction_id = $1, error_message = $2, completed_at = NOW() WHERE id = $3`,
    [replicateId, errorMsg || 'Generation failed', job.id]
  );
  await finalizeJobCost(job.id, job.style_id, 'failed');
  throw new Error(errorMsg || 'Replicate generation failed');
}
