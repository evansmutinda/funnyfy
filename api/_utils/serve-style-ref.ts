import fs from 'fs';
import path from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  normalizeStyleRefKey,
  verifyStyleRefSignature,
} from './style-refs';

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

function resolveStyleRefDiskPath(referenceImage: string): string | null {
  const key = normalizeStyleRefKey(referenceImage);
  if (!key) return null;
  const relative = key.replace(/^style-refs\//, '');
  const root = path.resolve(process.cwd(), 'server-style-refs');
  const resolved = path.resolve(root, relative);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

/**
 * Serves a private template when signed query params are present.
 * Lives on /api/styles (rewritten from /api/style-ref) so we stay within
 * Vercel Hobby's 12-function limit.
 */
export async function tryServeSignedStyleRef(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  const p = queryValue(req.query.p);
  const e = queryValue(req.query.e);
  const s = queryValue(req.query.s);
  if (!p && !e && !s) return false;

  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    res.status(405).json({ ok: false, error: 'Only GET allowed' });
    return true;
  }

  const key = verifyStyleRefSignature(p, e, s);
  const filePath = key ? resolveStyleRefDiskPath(key) : null;

  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return true;
  }

  try {
    const body = await fs.promises.readFile(filePath);
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(body);
    return true;
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return true;
  }
}
