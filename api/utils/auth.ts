// Authentication middleware and utilities

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractUserId, safeErrorResponse } from './security';
import { userIdSchema } from './validation';

// Middleware to require authentication
export function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): string | null {
  const userId = extractUserId(req);
  
  if (!userId) {
    safeErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED', 'User authentication required');
    return null;
  }

  // Validate UUID format
  const validation = userIdSchema.safeParse(userId);
  if (!validation.success) {
    safeErrorResponse(res, 400, 'INVALID_USER_ID', 'User ID must be a valid UUID');
    return null;
  }

  return validation.data;
}

// Optional auth (returns userId if present, but doesn't error if missing)
export function optionalAuth(req: VercelRequest): string | null {
  const userId = extractUserId(req);
  if (!userId) return null;
  
  const validation = userIdSchema.safeParse(userId);
  return validation.success ? validation.data : null;
}
