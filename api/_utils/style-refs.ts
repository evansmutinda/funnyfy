import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getPublicApiBaseUrl } from './replicate-sync';

/** Replicate may not fetch immediately if the queue is busy. */
const STYLE_REF_TTL_SEC = 30 * 60;

const REF_PATH_RE = /^style-refs\/[a-z0-9][a-z0-9._/-]*$/i;

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function hmacSecret(): string | null {
  const secret = (
    process.env.STYLE_REF_SECRET ||
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    ''
  ).trim();
  return secret || null;
}

function publicBaseUrl(): string | null {
  const fromApi = getPublicApiBaseUrl();
  if (fromApi) return fromApi;

  const vercel = (process.env.VERCEL_URL || '').trim().replace(/^https?:\/\//, '');
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  const styled = (process.env.STYLE_ASSETS_BASE_URL || '').trim().replace(/\/$/, '');
  if (styled.startsWith('https://')) return styled;

  return null;
}

/** Canonical key stored on StyleConfig.referenceImage, e.g. style-refs/caricatures/mugface.png */
export function normalizeStyleRefKey(referenceImage: string): string | null {
  const raw = referenceImage.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  if (!raw || raw.includes('..') || !REF_PATH_RE.test(raw)) return null;
  return raw;
}

function assetsRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), 'api', '_assets', 'style-refs'),
    path.resolve(__dirname, '..', '_assets', 'style-refs'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

export function resolveStyleRefDiskPath(referenceImage: string): string | null {
  const key = normalizeStyleRefKey(referenceImage);
  if (!key) return null;

  const relative = key.replace(/^style-refs\//, '');
  const root = assetsRoot();
  const resolved = path.resolve(root, relative);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

export function styleRefMimeType(filePath: string): string {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function signPayload(key: string, exp: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${key}.${exp}`).digest('hex');
}

function signaturesMatch(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Short-lived HTTPS URL Replicate can fetch. Files stay off /public. */
export function buildSignedStyleRefUrl(referenceImage: string): string | null {
  const key = normalizeStyleRefKey(referenceImage);
  const secret = hmacSecret();
  const base = publicBaseUrl();
  if (!key || !secret || !base) {
    console.warn('[style-refs] Cannot sign reference URL', {
      hasKey: Boolean(key),
      hasSecret: Boolean(secret),
      hasBase: Boolean(base),
    });
    return null;
  }

  const exp = Math.floor(Date.now() / 1000) + STYLE_REF_TTL_SEC;
  const sig = signPayload(key, exp, secret);
  const url = new URL('/api/style-ref', base);
  url.searchParams.set('p', key);
  url.searchParams.set('e', String(exp));
  url.searchParams.set('s', sig);
  return url.toString();
}

export function verifyStyleRefRequest(p: string, e: string, s: string): {
  ok: true;
  filePath: string;
} | { ok: false } {
  const key = normalizeStyleRefKey(p);
  const secret = hmacSecret();
  const exp = Number(e);
  const sig = (s || '').trim().toLowerCase();
  if (!key || !secret || !sig || !Number.isFinite(exp)) return { ok: false };
  if (exp < Math.floor(Date.now() / 1000)) return { ok: false };
  if (!signaturesMatch(signPayload(key, exp, secret), sig)) return { ok: false };

  const filePath = resolveStyleRefDiskPath(key);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return { ok: false };
  }
  return { ok: true, filePath };
}
