import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnabledStyles } from './_utils/styles-config';
import { STYLE_CATEGORIES } from './_utils/style-catalog';
import {
  buildAppConfigPayload,
  filterStylesForClientVersion,
  resolveClientAppVersion,
} from './_utils/app-version';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-App-Version',
  );
};

function wantsAppConfigOnly(req: VercelRequest): boolean {
  const raw = req.query.appConfig;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === '1' || value === 'true' || value === 'yes';
}

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

  const clientVersion = resolveClientAppVersion(
    req.headers['x-app-version'],
    req.query.appVersion,
  );
  const appConfig = buildAppConfigPayload(clientVersion);

  // Lightweight config-only response (also served via /api/app-config rewrite).
  if (wantsAppConfigOnly(req)) {
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=3600',
    );
    if (allowedOrigin !== '*') {
      res.setHeader('Vary', 'Origin, X-App-Version');
    }
    return res.status(200).json({
      ok: true,
      ...appConfig,
    });
  }

  const styles = filterStylesForClientVersion(getEnabledStyles(), clientVersion);

  // Public catalog — safe to cache at Vercel edge (no auth / user data).
  // Vary on app version so filtered catalogs aren't mixed across clients.
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=86400'
  );
  if (allowedOrigin !== '*') {
    res.setHeader('Vary', 'Origin, X-App-Version');
  } else {
    res.setHeader('Vary', 'X-App-Version');
  }

  // Return styles (prompts are protected on server - not sent to client)
  return res.status(200).json({
    ok: true,
    categories: STYLE_CATEGORIES,
    styles: styles.map(({ prompt, model, models, ...style }) => ({
      ...style,
    })),
    ...appConfig,
  });
}
