import path from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from './_utils/middleware';
import { STYLE_REF_BUFFERS } from './_utils/style-ref-buffers';
import { verifyStyleRefSignature } from './_utils/style-refs';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const key = verifyStyleRefSignature(
    queryValue(req.query.p),
    queryValue(req.query.e),
    queryValue(req.query.s),
  );
  const body = key ? STYLE_REF_BUFFERS[key] : null;

  if (!key || !body) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  const mime = MIME_BY_EXT[path.extname(key).toLowerCase()] || 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(body);
}
