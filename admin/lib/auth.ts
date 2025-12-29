// Admin authentication utilities (client-side)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://funnyfy-staging.vercel.app');

export interface AdminUser {
  userId: string;
  email?: string;
  role?: string;
}

// Store token in localStorage (simple, can upgrade to httpOnly cookies later)
export function setAdminToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
}

export function removeAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

// Login as admin (creates a JWT token with admin role)
export async function adminLogin(
  userId: string,
  password?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        password, // Optional for now
      }),
    });

    const data = await response.json();

    if (data.ok && data.token) {
      setAdminToken(data.token);
      return { success: true, token: data.token };
    }

    return { success: false, error: data.error || data.message || 'Login failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed' };
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getAdminToken() !== null;
}

// Get authenticated user info from token (client-side decode, not verified)
export function getAdminUser(): AdminUser | null {
  const token = getAdminToken();
  if (!token) return null;

  try {
    // Simple JWT decode (client-side, not verified - server will verify)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId || payload.sub,
      email: payload.email,
      role: payload.role || 'admin',
    };
  } catch {
    return null;
  }
}

// Make authenticated API request
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
}

