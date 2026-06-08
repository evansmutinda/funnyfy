// Authentication service for Funnyfy mobile app
// Handles JWT token storage, retrieval, and user session management

import * as FileSystem from 'expo-file-system';

const TOKEN_FILE = FileSystem.documentDirectory + 'auth_token.json';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://funnyfyapp.vercel.app';

export type AuthSession = {
  token: string;
  userId: string;
  expiresAt: number; // Unix timestamp (ms)
};

// ─── Persistence ─────────────────────────────────────────────────────────────

async function saveSession(session: AuthSession): Promise<void> {
  await FileSystem.writeAsStringAsync(TOKEN_FILE, JSON.stringify(session));
}

async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(TOKEN_FILE);
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

async function clearSession(): Promise<void> {
  try {
    await FileSystem.deleteAsync(TOKEN_FILE, { idempotent: true });
  } catch {}
}

// ─── Token helpers ────────────────────────────────────────────────────────────

function isExpired(session: AuthSession): boolean {
  // Refresh if less than 3 days remain
  return Date.now() > session.expiresAt - 3 * 24 * 60 * 60 * 1000;
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchNewToken(revenuecatUserId?: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(revenuecatUserId ? { revenuecatUserId } : {}),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Token request failed (${res.status})`);
  }

  return {
    token: json.token,
    userId: json.userId,
    // expiresIn is "30d" — store as timestamp 30 days from now
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}

async function refreshToken(token: string): Promise<AuthSession | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok || !json.ok) return null;

    return {
      token: json.token,
      userId: json.userId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get (or create) a valid auth session.
 * - Loads cached session from disk
 * - Refreshes if close to expiry
 * - Creates a new anonymous session if none exists
 *
 * Pass `revenuecatUserId` the first time to associate the session with RC.
 */
export async function getOrCreateSession(
  revenuecatUserId?: string
): Promise<AuthSession> {
  const cached = await loadSession();

  if (cached) {
    if (!isExpired(cached)) return cached;

    // Try to refresh
    const refreshed = await refreshToken(cached.token);
    if (refreshed) {
      await saveSession(refreshed);
      return refreshed;
    }
    // Refresh failed — fall through and create a new session
  }

  const session = await fetchNewToken(revenuecatUserId);
  await saveSession(session);
  return session;
}

/**
 * Returns the Authorization header value for API calls.
 */
export function authHeader(session: AuthSession): Record<string, string> {
  return {
    Authorization: `Bearer ${session.token}`,
    'x-user-id': session.userId,
  };
}

/**
 * Clear the stored session (e.g. on sign-out).
 */
export async function signOut(): Promise<void> {
  await clearSession();
}
