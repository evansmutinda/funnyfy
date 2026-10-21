// Admin mutation audit. Writes to security_logs.
//
// security_logs.user_id references users(id). Admin accounts live in admin_users
// and are not app users, so the acting admin id is stored in details.adminId.
// user_id is the affected app user when there is one.

import type { VercelRequest } from '@vercel/node';
import { logSecurityEventFromRequest } from './security-logging';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeAdminReason(raw: unknown): string | null {
  const reason = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!reason || reason.length > 280) return null;
  return reason;
}

export async function logAdminAction(
  req: VercelRequest,
  adminId: string,
  eventType: string,
  success: boolean,
  details: Record<string, unknown>,
  targetUserId?: string | null,
): Promise<void> {
  const userId = targetUserId && UUID_REGEX.test(targetUserId) ? targetUserId : null;
  await logSecurityEventFromRequest(
    req,
    eventType,
    success,
    { adminId, ...details },
    userId,
  );
}
