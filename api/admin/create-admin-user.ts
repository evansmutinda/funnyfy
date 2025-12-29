// Helper endpoint to create an admin user
// POST /api/admin/create-admin-user
// This is a one-time setup endpoint - can be removed after setup

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import { applyMiddleware, parseBody } from '../utils/middleware';
import { safeErrorResponse } from '../utils/security';

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

  const { revenuecatUserId, email } = bodyResult.data as {
    revenuecatUserId?: string;
    email?: string;
  };

  try {
    // Create a new user
    const insertResult = await query<{ id: string }>(
      `
        INSERT INTO users (
          revenuecat_user_id,
          email,
          subscription_status,
          subscription_tier,
          trial_generations_used,
          created_at
        )
        VALUES ($1, $2, 'trial', NULL, 0, NOW())
        RETURNING id
      `,
      [revenuecatUserId || null, email || null]
    );

    const userId = insertResult.rows[0]?.id;

    if (!userId) {
      return safeErrorResponse(
        res,
        500,
        'USER_CREATION_FAILED',
        'Failed to create user'
      );
    }

    return res.status(200).json({
      ok: true,
      userId,
      message: 'User created successfully',
      instructions: [
        '1. Copy the userId above',
        '2. Go to Vercel Dashboard → Settings → Environment Variables',
        '3. Add ADMIN_USER_IDS with your userId',
        '4. Redeploy your project',
        '5. You can now login to /admin/login with this userId',
      ],
    });
  } catch (err: any) {
    console.error('[admin/create-admin-user] Failed:', err);
    return safeErrorResponse(
      res,
      500,
      'USER_CREATION_FAILED',
      'Failed to create user'
    );
  }
}

