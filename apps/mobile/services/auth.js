// Auth service — gets a real user ID and JWT from the backend on first launch,
// then stores them on the device so the user stays logged in between sessions.
// Falls back to a locally generated ID if the backend is unavailable (e.g. DB issue).

import * as FileSystem from 'expo-file-system';

const AUTH_FILE = FileSystem.documentDirectory + '.funnyfyauth.json';

// Read stored auth from device
async function readStored() {
  try {
    const text = await FileSystem.readAsStringAsync(AUTH_FILE);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Write auth to device
async function writeStored(data) {
  try {
    await FileSystem.writeAsStringAsync(AUTH_FILE, JSON.stringify(data));
  } catch (err) {
    console.warn('[Auth] Failed to persist auth:', err.message);
  }
}

// Generate a UUID v4 without any external library
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Main init function — call this on app startup
// revenuecatUserId: the anonymous ID from RevenueCat SDK (optional)
export async function initAuth(apiBase, revenuecatUserId = null) {
  // Return stored auth if we already have it
  const stored = await readStored();
  if (stored?.userId) {
    console.log('[Auth] Using stored auth, userId:', stored.userId);
    return stored;
  }

  // Try to get auth from backend (creates user in DB)
  try {
    console.log('[Auth] Requesting token from backend...');
    const res = await fetch(`${apiBase}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        revenuecatUserId ? { revenuecatUserId } : {}
      ),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.token && data.userId) {
        const auth = { userId: data.userId, token: data.token, isLocal: false };
        await writeStored(auth);
        console.log('[Auth] Got token from backend, userId:', data.userId);
        return auth;
      }
    }

    const errorText = await res.text().catch(() => 'unknown');
    console.warn('[Auth] Backend returned error:', res.status, errorText);
  } catch (err) {
    console.warn('[Auth] Backend unavailable, using local ID. Error:', err.message);
  }

  // Fallback: generate a local UUID and persist it
  // This keeps the app working even when the backend/DB is down.
  // When the backend is fixed, the stored local ID will keep the same
  // user consistent across sessions until they reinstall.
  const localId = generateUUID();
  const fallback = { userId: localId, token: null, isLocal: true };
  await writeStored(fallback);
  console.warn('[Auth] Using local fallback userId:', localId);
  return fallback;
}

// Clear stored auth (e.g. on logout)
export async function clearAuth() {
  try {
    await FileSystem.deleteAsync(AUTH_FILE, { idempotent: true });
  } catch {}
}

// Call this once to force re-authentication (clears any local fallback ID)
export async function resetAuthIfLocal() {
  try {
    const stored = await readStored();
    if (stored?.isLocal) {
      console.log('[Auth] Clearing local fallback ID to get real auth...');
      await FileSystem.deleteAsync(AUTH_FILE, { idempotent: true });
    }
  } catch {}
}
