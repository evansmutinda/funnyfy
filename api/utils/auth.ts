// Authentication middleware and utilities

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractUserId, safeErrorResponse } from './security';
import { userIdSchema } from './validation';
import { logSecurityEventFromRequest } from './security-logging';

// Middleware to require authentication
export function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): string | null {
  const userId = extractUserId(req);
  
  if (!userId) {
    // Log failed authentication attempt
    logSecurityEventFromRequest(req, 'auth_failed', false, {
      reason: 'missing_user_id',
    }).catch(console.error); // Don't block on logging
    
    safeErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED', 'User authentication required');
    return null;
  }

  // Validate UUID format
  const validation = userIdSchema.safeParse(userId);
  if (!validation.success) {
    // Log invalid user ID format
    logSecurityEventFromRequest(req, 'auth_failed', false, {
      reason: 'invalid_user_id_format',
      userId: userId.slice(0, 50), // Log partial for debugging
    }).catch(console.error);
    
    safeErrorResponse(res, 400, 'INVALID_USER_ID', 'User ID must be a valid UUID');
    return null;
  }

  // Log successful authentication
  logSecurityEventFromRequest(req, 'auth_success', true, {
    userId: validation.data,
  }).catch(console.error);

  return validation.data;
}

// Optional auth (returns userId if present, but doesn't error if missing)
export function optionalAuth(req: VercelRequest): string | null {
  const userId = extractUserId(req);
  if (!userId) return null;
  
  const validation = userIdSchema.safeParse(userId);
  return validation.success ? validation.data : null;
}
