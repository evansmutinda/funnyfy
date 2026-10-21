// Auth service — gets a real user ID and JWT from the backend on first launch,
// then stores them on the device so the user stays logged in between sessions.
// Falls back to a locally generated ID if the backend is unavailable (e.g. DB issue).
//
// Across reinstalls, identity is recovered via RevenueCat ids (after Play restore),
// not via SecureStore (which is wiped).

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

const AUTH_KEY = 'funnyfy.auth';
const LEGACY_AUTH_FILE = FileSystem.documentDirectory + '.funnyfyauth.json';

const devLog = (...args) => {
  if (__DEV__) console.log(...args);
};

const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function migrateLegacyAuthFile() {
  try {
    const text = await FileSystem.readAsStringAsync(LEGACY_AUTH_FILE);
    const data = JSON.parse(text);
    if (data?.userId) {
      await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(data));
      await FileSystem.deleteAsync(LEGACY_AUTH_FILE, { idempotent: true });
      devLog('[Auth] Migrated legacy auth file to SecureStore');
      return data;
    }
  } catch {
    // No legacy file or unreadable — normal on fresh installs.
  }
  return null;
}

async function readStored() {
  try {
    const text = await SecureStore.getItemAsync(AUTH_KEY);
    if (text) return JSON.parse(text);
  } catch (err) {
    console.warn('[Auth] SecureStore read failed:', err?.message || err);
  }
  return migrateLegacyAuthFile();
}

async function writeStored(data) {
  try {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[Auth] Failed to persist auth:', err.message);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Normalize legacy string or { revenuecatIds / revenuecatUserId } into id list. */
export function normalizeRevenueCatIdentity(revenuecatIdentity) {
  if (!revenuecatIdentity) return [];
  if (typeof revenuecatIdentity === 'string') {
    const id = revenuecatIdentity.trim();
    return id ? [id] : [];
  }
  const ids = [];
  const push = (v) => {
    const id = String(v || '').trim();
    if (id && !ids.includes(id)) ids.push(id);
  };
  if (Array.isArray(revenuecatIdentity.revenuecatIds)) {
    revenuecatIdentity.revenuecatIds.forEach(push);
  }
  push(revenuecatIdentity.revenuecatUserId);
  push(revenuecatIdentity.revenuecatAppUserId);
  push(revenuecatIdentity.originalAppUserId);
  push(revenuecatIdentity.currentAppUserId);
  return ids;
}

export async function hasStoredAuth() {
  const stored = await readStored();
  return Boolean(stored?.userId && stored?.token);
}

/**
 * Main init — call on app startup.
 * @param {string} apiBase
 * @param {string|{reclaimToken?: string, userId?: string, revenuecatIds?: string[], revenuecatUserId?: string, revenuecatAppUserId?: string}|null} revenuecatIdentity
 */
export async function initAuth(apiBase, revenuecatIdentity = null) {
  const stored = await readStored();
  if (stored?.userId && stored?.token) {
    // Reclaim must clear first (forceReAuth); otherwise keep stored session.
    const hasReclaim =
      revenuecatIdentity &&
      typeof revenuecatIdentity === 'object' &&
      revenuecatIdentity.reclaimToken;
    if (!hasReclaim) {
      devLog('[Auth] Using stored auth, userId:', stored.userId);
      return stored;
    }
    await clearAuth();
  }
  if (stored?.userId && !stored?.token) {
    devLog('[Auth] Stored auth has no token, clearing and re-authenticating...');
    await clearAuth();
  }

  const reclaimToken =
    revenuecatIdentity &&
    typeof revenuecatIdentity === 'object' &&
    typeof revenuecatIdentity.reclaimToken === 'string'
      ? revenuecatIdentity.reclaimToken.trim()
      : '';
  const revenuecatIds = normalizeRevenueCatIdentity(revenuecatIdentity);
  const body = reclaimToken
    ? {
        reclaimToken,
        ...(revenuecatIds.length
          ? {
              revenuecatIds,
              revenuecatUserId: revenuecatIds[0],
              ...(revenuecatIds[1] ? { revenuecatAppUserId: revenuecatIds[1] } : {}),
            }
          : {}),
      }
    : revenuecatIds.length > 0
      ? {
          revenuecatIds,
          revenuecatUserId: revenuecatIds[0],
          ...(revenuecatIds[1] ? { revenuecatAppUserId: revenuecatIds[1] } : {}),
        }
      : {};

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      devLog(
        '[Auth] Requesting token from backend...',
        attempt > 0 ? `(retry ${attempt})` : '',
        reclaimToken
          ? 'reclaimToken'
          : revenuecatIds.length
            ? `rcIds=${revenuecatIds.length}`
            : 'no-rc',
      );
      const res = await fetchWithTimeout(`${apiBase}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.token && data.userId) {
          const auth = { userId: data.userId, token: data.token, isLocal: false };
          await writeStored(auth);
          devLog('[Auth] Got token from backend, userId:', data.userId);
          return auth;
        }
      }

      const errorBody = await res.json().catch(() => ({}));
      console.warn('[Auth] Backend returned error:', res.status, errorBody.error, errorBody.hint || '');
    } catch (err) {
      console.warn('[Auth] Backend request failed:', err.message);
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  const localId = generateUUID();
  const fallback = { userId: localId, token: null, isLocal: true };
  await writeStored(fallback);
  if (__DEV__) {
    console.warn('[Auth] Using local fallback userId:', localId);
  } else {
    console.warn('[Auth] Using local fallback ID — backend unavailable');
  }
  return fallback;
}

export async function clearAuth() {
  try {
    await SecureStore.deleteItemAsync(AUTH_KEY);
  } catch {}
  try {
    await FileSystem.deleteAsync(LEGACY_AUTH_FILE, { idempotent: true });
  } catch {}
}

export async function forceReAuth(apiBase, revenuecatIdentity = null) {
  await clearAuth();
  return initAuth(apiBase, revenuecatIdentity);
}

export async function resetAuthIfLocal() {
  try {
    const stored = await readStored();
    if (stored?.isLocal) {
      devLog('[Auth] Clearing local fallback ID to get real auth...');
      await clearAuth();
    }
  } catch {}
}
