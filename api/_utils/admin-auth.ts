// Admin authentication middleware
// Checks for admin role in JWT token

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT, safeErrorResponse } from './security';
import { extractUserId } from './security';

/**
 * Require admin authentication
 * Checks for valid JWT token with admin role
 */
export function requireAdminAuth(
  req: VercelRequest,
  res: VercelResponse
): { userId: string; role: string } | null {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    safeErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED', 'Bearer token required');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify JWT token
  const decoded = verifyJWT(token);
  if (!decoded) {
    safeErrorResponse(res, 401, 'INVALID_TOKEN', 'Invalid or expired token');
    return null;
  }

  // Check for admin role (decode token to check role claim)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const role = payload.role || 'user';

    if (role !== 'admin') {
      safeErrorResponse(res, 403, 'ACCESS_DENIED', 'Admin access required');
      return null;
    }

    return {
      userId: decoded.userId,
      role: 'admin',
    };
  } catch (err) {
    safeErrorResponse(res, 401, 'INVALID_TOKEN', 'Invalid token format');
    return null;
  }
}

