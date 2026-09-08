import fs from 'fs';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from './_utils/middleware';
import {
  styleRefMimeType,
  verifyStyleRefRequest,
} from './_utils/style-refs';

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const verified = verifyStyleRefRequest(
    queryValue(req.query.p),
    queryValue(req.query.e),
    queryValue(req.query.s),
  );

  if (!verified.ok) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  try {
    const body = await fs.promises.readFile(verified.filePath);
    res.setHeader('Content-Type', styleRefMimeType(verified.filePath));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(body);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }
}
