import crypto from 'crypto';

/** Replicate may not fetch immediately if the queue is busy. */
const STYLE_REF_TTL_SEC = 30 * 60;

const REF_PATH_RE = /^style-refs\/[a-z0-9][a-z0-9._/-]*$/i;

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
  // Style files live on this deployment. Never use ALLOWED_ORIGIN — that is CORS
  // and is often the other project (funnyfyapp vs funnyfy-staging).
  const candidates = [
    process.env.STYLE_ASSETS_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, '')}`
      : null,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`
      : null,
    process.env.PUBLIC_API_URL,
    process.env.WEBHOOK_BASE_URL,
  ];

  for (const raw of candidates) {
    const value = String(raw || '')
      .trim()
      .replace(/\/$/, '');
    if (value.startsWith('https://') && value !== 'https://*') {
      return value;
    }
  }
  return null;
}

/** Canonical key stored on StyleConfig.referenceImage, e.g. style-refs/caricatures/mugface.png */
export function normalizeStyleRefKey(referenceImage: string): string | null {
  const raw = referenceImage.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  if (!raw || raw.includes('..') || !REF_PATH_RE.test(raw)) return null;
  return raw;
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

/** Validate HMAC + expiry. Does not touch disk (keeps images out of other lambdas). */
export function verifyStyleRefSignature(p: string, e: string, s: string): string | null {
  const key = normalizeStyleRefKey(p);
  const secret = hmacSecret();
  const exp = Number(e);
  const sig = (s || '').trim().toLowerCase();
  if (!key || !secret || !sig || !Number.isFinite(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;
  if (!signaturesMatch(signPayload(key, exp, secret), sig)) return null;
  return key;
}
