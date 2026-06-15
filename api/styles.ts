import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnabledStyles } from './_utils/styles-config';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Only GET allowed' });
  }

  // Get all enabled styles from shared config
  const styles = getEnabledStyles();

  // Return styles (prompts are protected on server - not sent to client)
  return res.status(200).json({
    ok: true,
    styles: styles.map(({ prompt, model, ...style }) => ({
      ...style,
      // Don't send prompt or model to client - they're protected
      // Prompt and model will be used server-side only in test.ts
    }))
  });
}
