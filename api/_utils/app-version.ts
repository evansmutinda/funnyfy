/**
 * App version gating for Play Store updates + style catalog filtering.
 *
 * Resolution order (per field):
 * 1. Admin override in `app_settings` (key `app_version_gates`) when present
 * 2. Vercel env fallback
 *
 * Env (Vercel) fallbacks:
 * - LATEST_APP_VERSION — newest build on Play (soft update nudge). Empty = no soft nudge.
 * - MIN_REQUIRED_APP_VERSION — clients below this must update (blocking). Empty = no force update.
 * - MIN_APP_VERSION — global minimum for full style catalog (optional; separate from force).
 * - APP_STORE_URL — Play Store listing URL.
 */

import type { StyleConfig } from './styles-config';
import { query } from './db';

const DEFAULT_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.evansks.funnyfyapp';

const SETTINGS_KEY = 'app_version_gates';

/** Soft cache so /api/styles does not hit Postgres on every request. */
const CACHE_TTL_MS = 15_000;
let cachedConfig: { value: AppVersionConfig; expiresAt: number } | null = null;

export type AppVersionConfig = {
  latestAppVersion: string | null;
  minAppVersion: string | null;
  minRequiredAppVersion: string | null;
  storeUrl: string;
};

export type AppVersionOverrides = {
  latestAppVersion?: string | null;
  minAppVersion?: string | null;
  minRequiredAppVersion?: string | null;
  storeUrl?: string | null;
  updatedAt?: string;
  updatedBy?: string;
};

export type AppVersionAdminView = AppVersionConfig & {
  source: 'admin' | 'env';
  envFallback: AppVersionConfig;
  overrides: AppVersionOverrides | null;
  updatedAt: string | null;
  updatedBy: string | null;
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

function normalizeVersion(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  return raw || null;
}

function normalizeStoreUrl(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  return raw;
}

/** Allow 1.3.26, 1.3.26+401, v1.2.3 — empty clears the gate. */
export function isValidAppVersionInput(value: string): boolean {
  const raw = value.trim();
  if (!raw) return true;
  return /^v?\d+(\.\d+){0,3}(\+\d+)?$/i.test(raw);
}

export function isValidStoreUrlInput(value: string): boolean {
  const raw = value.trim();
  if (!raw) return true;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getEnvAppVersionConfig(): AppVersionConfig {
  const latest = process.env.LATEST_APP_VERSION?.trim() || null;
  const min = process.env.MIN_APP_VERSION?.trim() || null;
  const minRequired = process.env.MIN_REQUIRED_APP_VERSION?.trim() || null;
  const storeUrl =
    process.env.APP_STORE_URL?.trim() ||
    process.env.EXPO_PUBLIC_APP_STORE_URL?.trim() ||
    DEFAULT_STORE_URL;

  return {
    latestAppVersion: latest,
    minAppVersion: min,
    minRequiredAppVersion: minRequired,
    storeUrl,
  };
}

/** @deprecated Prefer getAppVersionConfig() — sync env-only snapshot for callers that cannot await. */
export function getAppVersionConfigSync(): AppVersionConfig {
  return getEnvAppVersionConfig();
}

async function ensureAppSettingsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function readOverrides(): Promise<AppVersionOverrides | null> {
  try {
    await ensureAppSettingsTable();
    const result = await query<{ value: AppVersionOverrides; updated_at: string }>(
      `SELECT value, updated_at FROM app_settings WHERE key = $1`,
      [SETTINGS_KEY],
    );
    const row = result.rows[0];
    if (!row?.value || typeof row.value !== 'object') return null;
    return {
      ...row.value,
      updatedAt: row.value.updatedAt || row.updated_at || undefined,
    };
  } catch (err) {
    console.error('[app-version] Failed to read admin overrides:', err);
    return null;
  }
}

function mergeConfig(
  env: AppVersionConfig,
  overrides: AppVersionOverrides | null,
): AppVersionConfig {
  if (!overrides) return env;

  const pick = (
    key: 'latestAppVersion' | 'minAppVersion' | 'minRequiredAppVersion',
  ): string | null => {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      return normalizeVersion(overrides[key]);
    }
    return env[key];
  };

  const storeUrl = Object.prototype.hasOwnProperty.call(overrides, 'storeUrl')
    ? normalizeStoreUrl(overrides.storeUrl, env.storeUrl)
    : env.storeUrl;

  return {
    latestAppVersion: pick('latestAppVersion'),
    minAppVersion: pick('minAppVersion'),
    minRequiredAppVersion: pick('minRequiredAppVersion'),
    storeUrl,
  };
}

export function invalidateAppVersionCache(): void {
  cachedConfig = null;
}

export async function getAppVersionConfig(): Promise<AppVersionConfig> {
  const now = Date.now();
  if (cachedConfig && cachedConfig.expiresAt > now) {
    return cachedConfig.value;
  }

  const env = getEnvAppVersionConfig();
  const overrides = await readOverrides();
  const value = mergeConfig(env, overrides);
  cachedConfig = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

export async function getAppVersionAdminView(): Promise<AppVersionAdminView> {
  const envFallback = getEnvAppVersionConfig();
  const overrides = await readOverrides();
  const merged = mergeConfig(envFallback, overrides);
  const hasAdmin =
    !!overrides &&
    ('latestAppVersion' in overrides ||
      'minAppVersion' in overrides ||
      'minRequiredAppVersion' in overrides ||
      'storeUrl' in overrides);

  return {
    ...merged,
    source: hasAdmin ? 'admin' : 'env',
    envFallback,
    overrides,
    updatedAt: overrides?.updatedAt || null,
    updatedBy: overrides?.updatedBy || null,
  };
}

export async function setAppVersionConfig(
  input: {
    latestAppVersion?: string | null;
    minAppVersion?: string | null;
    minRequiredAppVersion?: string | null;
    storeUrl?: string | null;
  },
  updatedBy: string,
): Promise<AppVersionAdminView> {
  const latest = normalizeVersion(input.latestAppVersion);
  const min = normalizeVersion(input.minAppVersion);
  const minRequired = normalizeVersion(input.minRequiredAppVersion);
  const storeRaw = String(input.storeUrl ?? '').trim();

  if (latest && !isValidAppVersionInput(latest)) {
    throw new Error('INVALID_LATEST');
  }
  if (min && !isValidAppVersionInput(min)) {
    throw new Error('INVALID_MIN');
  }
  if (minRequired && !isValidAppVersionInput(minRequired)) {
    throw new Error('INVALID_MIN_REQUIRED');
  }
  if (storeRaw && !isValidStoreUrlInput(storeRaw)) {
    throw new Error('INVALID_STORE_URL');
  }

  const value: AppVersionOverrides = {
    latestAppVersion: latest,
    minAppVersion: min,
    minRequiredAppVersion: minRequired,
    storeUrl: storeRaw || null,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await ensureAppSettingsTable();
  await query(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [SETTINGS_KEY, JSON.stringify(value)],
  );

  invalidateAppVersionCache();
  return getAppVersionAdminView();
}

export async function clearAppVersionOverrides(): Promise<AppVersionAdminView> {
  await ensureAppSettingsTable();
  await query(`DELETE FROM app_settings WHERE key = $1`, [SETTINGS_KEY]);
  invalidateAppVersionCache();
  return getAppVersionAdminView();
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
  config?: AppVersionConfig,
): StyleConfig[] {
  const minAppVersion = (config || getEnvAppVersionConfig()).minAppVersion;

  return styles.filter((style) => {
    const required = style.minAppVersion?.trim() || minAppVersion;
    if (!required) return true;
    // Unknown client version: keep style (avoid empty catalog on old clients that omit the header).
    if (!clientVersion) return true;
    return isVersionAtLeast(clientVersion, required);
  });
}

export function buildAppConfigPayload(
  clientVersion: string | null,
  config?: AppVersionConfig,
) {
  const resolved = config || getEnvAppVersionConfig();
  const forceUpdate = Boolean(
    clientVersion &&
      resolved.minRequiredAppVersion &&
      compareSemver(clientVersion, resolved.minRequiredAppVersion) < 0,
  );
  const softUpdate = Boolean(
    clientVersion &&
      resolved.latestAppVersion &&
      compareSemver(clientVersion, resolved.latestAppVersion) < 0,
  );

  return {
    ...resolved,
    updateAvailable: softUpdate || forceUpdate,
    forceUpdate,
  };
}
