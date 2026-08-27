/**
 * App version gating for Play Store updates + style catalog filtering.
 *
 * Env (Vercel):
 * - LATEST_APP_VERSION — newest build published on Play (e.g. 1.2.4). Empty = no update nudge.
 * - MIN_APP_VERSION — global minimum for full catalog (optional).
 * - APP_STORE_URL — Play Store listing URL.
 */

import type { StyleConfig } from './styles-config';

const DEFAULT_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.evansks.funnyfyapp';

export type AppVersionConfig = {
  latestAppVersion: string | null;
  minAppVersion: string | null;
  storeUrl: string;
};

/** Compare dotted semver (ignores leading v). Returns -1 / 0 / 1. */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .trim()
      .replace(/^v/i, '')
      .split(/[.+-]/)
      .map((part) => {
        const n = parseInt(part, 10);
        return Number.isFinite(n) ? n : 0;
      });

  const pa = parse(a || '0');
  const pb = parse(b || '0');
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d < 0) return -1;
    if (d > 0) return 1;
  }
  return 0;
}

export function isVersionAtLeast(clientVersion: string, minimum: string): boolean {
  if (!minimum?.trim()) return true;
  if (!clientVersion?.trim()) return false;
  return compareSemver(clientVersion, minimum) >= 0;
}

export function getAppVersionConfig(): AppVersionConfig {
  const latest = process.env.LATEST_APP_VERSION?.trim() || null;
  const min = process.env.MIN_APP_VERSION?.trim() || null;
  const storeUrl =
    process.env.APP_STORE_URL?.trim() ||
    process.env.EXPO_PUBLIC_APP_STORE_URL?.trim() ||
    DEFAULT_STORE_URL;

  return {
    latestAppVersion: latest,
    minAppVersion: min,
    storeUrl,
  };
}

export function resolveClientAppVersion(
  headerValue: string | string[] | undefined,
  queryValue: string | string[] | undefined,
): string | null {
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const fromQuery = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const raw = (fromHeader || fromQuery || '').trim();
  return raw || null;
}

/**
 * Drop styles the installed app is too old to render (e.g. missing comparison assets).
 * Global MIN_APP_VERSION applies when set; per-style minAppVersion overrides further.
 */
export function filterStylesForClientVersion(
  styles: StyleConfig[],
  clientVersion: string | null,
): StyleConfig[] {
  const { minAppVersion } = getAppVersionConfig();

  return styles.filter((style) => {
    const required = style.minAppVersion?.trim() || minAppVersion;
    if (!required) return true;
    // Unknown client version: keep style (avoid empty catalog on old clients that omit the header).
    if (!clientVersion) return true;
    return isVersionAtLeast(clientVersion, required);
  });
}

export function buildAppConfigPayload(clientVersion: string | null) {
  const config = getAppVersionConfig();
  const updateAvailable = Boolean(
    clientVersion &&
      config.latestAppVersion &&
      compareSemver(clientVersion, config.latestAppVersion) < 0,
  );

  return {
    ...config,
    updateAvailable,
  };
}
