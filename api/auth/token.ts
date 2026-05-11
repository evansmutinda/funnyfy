// JWT Token Generation Endpoint
// Generates JWT tokens for mobile app authentication
// POST /api/auth/token

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { applyMiddleware, parseBody } from '../utils/middleware';
import { safeErrorResponse } from '../utils/security';
import { validateBody } from '../utils/validation';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

// Request schema: userId is optional (can create new user or use existing)
const tokenRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  revenuecatUserId: z.string().optional(), // RevenueCat appUserID
});

// Token expiration: 30 days (mobile apps can refresh)
const TOKEN_EXPIRATION = '30d';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware (CORS, headers, OPTIONS handling)
  if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;

  // Parse request body
  const bodyResult = parseBody(req);
  if (!bodyResult.success) {
    return safeErrorResponse(res, bodyResult.status, bodyResult.error);
  }

  // Validate request
  const validation = validateBody(tokenRequestSchema, bodyResult.data);
  if (!validation.success) {
    return safeErrorResponse(res, 400, validation.error);
  }

  const { userId, revenuecatUserId } = validation.data;

  // Check if JWT_SECRET is configured
  if (!JWT_SECRET) {
    console.error('[auth/token] JWT_SECRET not configured');
    return safeErrorResponse(
      res,
      500,
      'AUTH_CONFIG_ERROR',
      'Authentication not configured. Please set JWT_SECRET environment variable.'
    );
  }

  try {
    let finalUserId: string | null = null;

    // If userId provided, verify it exists
    if (userId) {
      const userResult = await query<{ id: string }>(
        `SELECT id FROM users WHERE id = $1 LIMIT 1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return safeErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      finalUserId = userResult.rows[0].id;
    }
    // If revenuecatUserId provided, find or create user
    else if (revenuecatUserId) {
      // Try to find existing user by revenuecat_user_id
      const userResult = await query<{ id: string }>(
        `SELECT id FROM users WHERE revenuecat_user_id = $1 LIMIT 1`,
        [revenuecatUserId]
      );

      if (userResult.rows.length > 0) {
        finalUserId = userResult.rows[0].id;
      } else {
        // Create new user with revenuecat_user_id
        const insertResult = await query<{ id: string }>(
          `
            INSERT INTO users
              (revenuecat_user_id, subscription_status, subscription_tier,
               trial_generations_used, billing_date, created_at, updated_at)
            VALUES ($1, 'trial', 'trial', 0, CURRENT_DATE, NOW(), NOW())
            RETURNING id
          `,
          [revenuecatUserId]
        );

        finalUserId = insertResult.rows[0]?.id || null;
      }
    }
    // No userId provided - create anonymous user
    else {
      const insertResult = await query<{ id: string }>(
        `
          INSERT INTO users
            (subscription_status, subscription_tier,
             trial_generations_used, billing_date, created_at, updated_at)
          VALUES ('trial', 'trial', 0, CURRENT_DATE, NOW(), NOW())
          RETURNING id
        `,
        []
      );

      finalUserId = insertResult.rows[0]?.id || null;
    }

    if (!finalUserId) {
      return safeErrorResponse(
        res,
        500,
        'USER_CREATION_FAILED',
        'Failed to create or find user'
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: finalUserId,
        sub: finalUserId, // Standard JWT claim
        iat: Math.floor(Date.now() / 1000), // Issued at
      },
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRATION,
      }
    );

    // Return token
    return res.status(200).json({
      ok: true,
      token,
      userId: finalUserId,
      expiresIn: TOKEN_EXPIRATION,
      message: 'Token generated successfully',
    });
  } catch (err: any) {
    console.error('[auth/token] Failed to generate token:', err);
    return res.status(500).json({
      ok: false,
      error: 'TOKEN_GENERATION_FAILED',
      detail: String(err?.message || err)
    });
  }
}
