import fs from 'fs';
import path from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from './_utils/middleware';
import {
  normalizeStyleRefKey,
  verifyStyleRefSignature,
} from './_utils/style-refs';

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

function assetsRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server-style-refs'),
    path.resolve(__dirname, '..', 'server-style-refs'),
    path.resolve(__dirname, 'server-style-refs'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

function resolveStyleRefDiskPath(referenceImage: string): string | null {
  const key = normalizeStyleRefKey(referenceImage);
  if (!key) return null;

  const relative = key.replace(/^style-refs\//, '');
  const root = assetsRoot();
  const resolved = path.resolve(root, relative);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const key = verifyStyleRefSignature(
    queryValue(req.query.p),
    queryValue(req.query.e),
    queryValue(req.query.s),
  );
  const filePath = key ? resolveStyleRefDiskPath(key) : null;

  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  try {
    const body = await fs.promises.readFile(filePath);
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(body);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }
}
