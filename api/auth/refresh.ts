// JWT Token Refresh Endpoint
// Refreshes an existing JWT token (extends expiration)
// POST /api/auth/refresh

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { applyMiddleware } from '../utils/middleware';
import { safeErrorResponse, verifyJWT } from '../utils/security';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const TOKEN_EXPIRATION = '30d';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware (CORS, headers, OPTIONS handling)
  if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;

  // Check if JWT_SECRET is configured
  if (!JWT_SECRET) {
    console.error('[auth/refresh] JWT_SECRET not configured');
    return safeErrorResponse(
      res,
      500,
      'AUTH_CONFIG_ERROR',
      'Authentication not configured'
    );
  }

  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return safeErrorResponse(
      res,
      401,
      'AUTHENTICATION_REQUIRED',
      'Bearer token required in Authorization header'
    );
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify existing token
  const decoded = verifyJWT(token);
  if (!decoded) {
    return safeErrorResponse(
      res,
      401,
      'INVALID_TOKEN',
      'Invalid or expired token'
    );
  }

  try {
    // Generate new token with same userId
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        sub: decoded.userId,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRATION,
      }
    );

    return res.status(200).json({
      ok: true,
      token: newToken,
      userId: decoded.userId,
      expiresIn: TOKEN_EXPIRATION,
      message: 'Token refreshed successfully',
    });
  } catch (err: any) {
    console.error('[auth/refresh] Failed to refresh token:', err);
    return safeErrorResponse(
      res,
      500,
      'TOKEN_REFRESH_FAILED',
      'Failed to refresh token'
    );
  }
}

