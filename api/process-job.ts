// Shared function to process a job with Replicate API
// Used by both synchronous /api/test and async queue worker

import { query } from './db';
import { getStyleById } from './styles-config';

const targetUrl = process.env.TARGET_API_URL;
const targetApiKey = process.env.TARGET_API_KEY;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Get style config
  const styleConfig = getStyleById(job.style_id);
  if (!styleConfig) {
    throw new Error(`Invalid styleId: ${job.style_id}`);
  }

  let prompt = styleConfig.prompt;
  const imageUrl = job.input_image_url;
  const modelVersion = styleConfig.model;

  const input: Record<string, unknown> = {
    prompt: prompt
  };

  // Add image if provided
  if (imageUrl) {
    if (modelVersion.includes('flux-kontext-pro') || modelVersion.includes('flux')) {
      input.input_image = imageUrl;
      input.aspect_ratio = 'match_input_image';
    } else if (modelVersion.includes('nano-banana')) {
      input.image_input = [imageUrl];
      input.image = imageUrl;
      input.image_url = imageUrl;
      if (!prompt.toLowerCase().includes('uploaded') && !prompt.toLowerCase().includes('photo') && !prompt.toLowerCase().includes('image') && !prompt.toLowerCase().includes('reference') && !prompt.toLowerCase().includes('provided')) {
        prompt = `Using the uploaded image as reference: ${prompt}`;
        input.prompt = prompt;
      }
    } else {
      input.input_image = imageUrl;
    }
  }

  const upstreamBody = {
    version: modelVersion,
    input: input
  };

  // Call Replicate API
  const fetchRes = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(targetApiKey ? { 'Authorization': `Token ${targetApiKey}` } : {})
    },
    body: JSON.stringify(upstreamBody)
  });

  let data = await fetchRes
    .json()
    .catch(() => ({ error: 'Non-JSON response from target API' }));

  if (!fetchRes.ok) {
    const errorMsg = typeof data === 'object' ? JSON.stringify(data) : String(data);
    await query(
      `
        UPDATE jobs
        SET status = $1,
            error_message = $2,
            completed_at = NOW()
        WHERE id = $3
      `,
      ['failed', errorMsg, job.id]
    );
    throw new Error(`Replicate API error: ${errorMsg}`);
  }

  // Poll Replicate until completion
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
  }

  // Check Replicate status - succeeded vs failed/canceled
  const replicateStatus = (data as any)?.status;
  const outputUrl = getImageUrlFromOutput((data as any)?.output);
  const replicateId = (data as any)?.id ?? null;
  const replicateError = (data as any)?.error ?? (data as any)?.logs ?? null;

  if (replicateStatus === 'succeeded' && outputUrl) {
    await query(
      `
        UPDATE jobs
        SET status = $1,
            output_image_url = $2,
            replicate_prediction_id = $3,
            error_message = NULL,
            completed_at = NOW()
        WHERE id = $4
      `,
      ['completed', outputUrl, replicateId, job.id]
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
      [replicateId, errorMsg || 'Generation failed', job.id]
    );
    throw new Error(errorMsg || 'Replicate generation failed');
  }
}
