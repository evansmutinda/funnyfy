import type { VercelRequest, VercelResponse } from '@vercel/node';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const targetUrl = process.env.TARGET_API_URL;
const targetApiKey = process.env.TARGET_API_KEY;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

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

  // Adapt payload shape for Replicate API
  // Our mobile app sends: { payload: { prompt: string, imageUrl?: string } }
  // Replicate expects: { version: "...", input: { prompt: "...", input_image?: "..." } }
  const prompt = typeof (payload as any)?.prompt === 'string'
    ? (payload as any).prompt
    : '';
  const imageUrl = typeof (payload as any)?.imageUrl === 'string'
    ? (payload as any).imageUrl
    : null;

  // Force use of FLUX Kontext Pro for all jobs
  const modelVersion = 'black-forest-labs/flux-kontext-pro';

  const input: Record<string, unknown> = {
    prompt: prompt || 'Hello from Funnyfy'
  };

  // Add image if provided (required for flux-kontext-pro)
  if (imageUrl) {
    (input as any).input_image = imageUrl;
    (input as any).aspect_ratio = 'match_input_image'; // Required for flux-kontext-pro
  }

  const upstreamBody = {
    version: modelVersion,
    input: input
  };

  try {
    const fetchRes = await fetch(targetUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Replicate API uses Authorization Token (not Bearer)
        ...(targetApiKey ? { Authorization: `Token ${targetApiKey}` } : {})
      },
      body: JSON.stringify(upstreamBody)
    });

    let data = await fetchRes
      .json()
      .catch(() => ({ error: 'Non-JSON response from target API' }));

    if (!fetchRes.ok) {
      // Log full error details for debugging
      console.error('Replicate API Error:', {
        status: fetchRes.status,
        statusText: fetchRes.statusText,
        url: targetUrl,
        requestBody: upstreamBody,
        responseData: data
      });

      // Extract detailed error message from Replicate response
      const errorMessage =
        (data as any)?.detail ||
        (data as any)?.error ||
        (data as any)?.message ||
        JSON.stringify(data);

      return res.status(fetchRes.status).json({
        ok: false,
        status: fetchRes.status,
        error: data,
        message: `Replicate API error (${fetchRes.status}): ${errorMessage}`,
        requestSent: {
          url: targetUrl,
          version: upstreamBody.version,
          inputKeys: Object.keys(upstreamBody.input)
        }
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

    return res.status(200).json({
      ok: true,
      status: fetchRes.status,
      data
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, error: 'Upstream API call failed', detail: String(err) });
  }
}
