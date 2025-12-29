// Admin login endpoint
// POST /api/admin/login

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { applyMiddleware, parseBody } from '../utils/middleware';
import { safeErrorResponse } from '../utils/security';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const TOKEN_EXPIRATION = '7d'; // Admin tokens expire in 7 days

// List of admin user IDs (for now - can move to database later)
// TODO: Move to database table for better management
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware
  if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;

  // Parse request body
  const bodyResult = parseBody(req);
  if (!bodyResult.success) {
    return safeErrorResponse(res, bodyResult.status, bodyResult.error);
  }

  const { userId, password } = bodyResult.data as { userId?: string; password?: string };

  if (!userId) {
    return safeErrorResponse(res, 400, 'MISSING_USER_ID', 'User ID is required');
  }

  // Check if JWT_SECRET is configured
  if (!JWT_SECRET) {
    return safeErrorResponse(
      res,
      500,
      'AUTH_CONFIG_ERROR',
      'Authentication not configured'
    );
  }

  try {
    let finalUserId: string = userId;

    // If ADMIN_USER_IDS is empty, skip database check (for testing)
    // This allows login with any UUID when database isn't set up
    if (ADMIN_USER_IDS.length === 0) {
      // Skip database check - allow any UUID for testing
      // Validate it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return safeErrorResponse(res, 400, 'INVALID_USER_ID', 'User ID must be a valid UUID format');
      }
      finalUserId = userId;
    } else {
      // ADMIN_USER_IDS is set - verify user exists in database
      const userResult = await query<{ id: string }>(
        `SELECT id FROM users WHERE id = $1 OR revenuecat_user_id = $1 LIMIT 1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return safeErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid user ID');
      }

      finalUserId = userResult.rows[0].id;

      // Check if user is in admin list
      const isAdmin = ADMIN_USER_IDS.includes(userId) || ADMIN_USER_IDS.includes(finalUserId);

      if (!isAdmin) {
        return safeErrorResponse(res, 403, 'ACCESS_DENIED', 'Admin access required. Add your user ID to ADMIN_USER_IDS in Vercel.');
      }
    }

    // Generate JWT token with admin role
    const token = jwt.sign(
      {
        userId: finalUserId,
        sub: finalUserId,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRATION,
      }
    );

    return res.status(200).json({
      ok: true,
      token,
      userId: finalUserId,
      role: 'admin',
      expiresIn: TOKEN_EXPIRATION,
      message: 'Login successful',
    });
  } catch (err: any) {
    console.error('[admin/login] Failed to login:', err);
    return safeErrorResponse(
      res,
      500,
      'LOGIN_FAILED',
      'Failed to process login'
    );
  }
}

