// Security logging utility for tracking security events
// Logs to database and console for monitoring and auditing

import type { VercelRequest } from '@vercel/node';
import { query } from '../db';
import { getClientIp } from './security';

export interface SecurityEvent {
  eventType: string;
  userId?: string | null;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

/**
 * Log a security event to database and console
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const {
    eventType,
    userId = null,
    ip,
    userAgent,
    success,
    details = {},
  } = event;

  // Add timestamp to details
  const eventDetails = {
    ...details,
    timestamp: new Date().toISOString(),
  };

  // Log to console (always)
  const logLevel = success ? 'info' : 'warn';
  const logMessage = `[security] ${eventType} - ${success ? 'SUCCESS' : 'FAILED'}`;
  console[logLevel](logMessage, {
    userId,
    ip,
    success,
    ...eventDetails,
  });

  // Log to database (async, don't block)
  try {
    await query(
      `
        INSERT INTO security_logs (
          event_type, user_id, ip_address, user_agent, success, details
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        eventType,
        userId,
        ip || null,
        userAgent ? userAgent.slice(0, 500) : null, // Limit length
        success,
        JSON.stringify(eventDetails),
      ]
    );
  } catch (err) {
    // Don't throw - logging failures shouldn't break the app
    console.error('[security-logging] Failed to log to database:', err);
  }
}

/**
 * Log security event from request context
 */
export async function logSecurityEventFromRequest(
  req: VercelRequest,
  eventType: string,
  success: boolean,
  details?: Record<string, any>,
  userId?: string | null
): Promise<void> {
  const ip = getClientIp(req);
  const userAgent = (req.headers['user-agent'] || 'unknown').slice(0, 500);

  await logSecurityEvent({
    eventType,
    userId: userId || null,
    ip,
    userAgent,
    success,
    details,
  });
}

/**
 * Get recent security events (for monitoring/admin dashboard)
 */
export async function getRecentSecurityEvents(
  limit: number = 100,
  eventType?: string,
  success?: boolean,
  userId?: string
): Promise<Array<{
  id: string;
  event_type: string;
  user_id: string | null;
  ip_address: string | null;
  success: boolean;
  details: any;
  created_at: Date;
}>> {
  try {
    let queryText = `
      SELECT id, event_type, user_id, ip_address, success, details, created_at
      FROM security_logs
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (eventType) {
      queryText += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (success !== undefined) {
      queryText += ` AND success = $${paramIndex}`;
      params.push(success);
      paramIndex++;
    }

    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(queryText, params);
    return result.rows;
  } catch (err) {
    console.error('[security-logging] Failed to get recent events:', err);
    return [];
  }
}

/**
 * Count security events (for monitoring)
 */
export async function countSecurityEvents(
  eventType?: string,
  success?: boolean,
  since?: Date
): Promise<number> {
  try {
    let queryText = `SELECT COUNT(*) as count FROM security_logs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (eventType) {
      queryText += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (success !== undefined) {
      queryText += ` AND success = $${paramIndex}`;
      params.push(success);
      paramIndex++;
    }

    if (since) {
      queryText += ` AND created_at >= $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    const result = await query<{ count: number }>(queryText, params);
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    console.error('[security-logging] Failed to count events:', err);
    return 0;
  }
}

/**
 * Check for suspicious activity (multiple failed attempts)
 */
export async function checkSuspiciousActivity(
  ip: string,
  eventType: string,
  timeWindowMinutes: number = 15,
  threshold: number = 5
): Promise<{
  suspicious: boolean;
  count: number;
}> {
  try {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const result = await query<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM security_logs
        WHERE ip_address = $1
          AND event_type = $2
          AND success = false
          AND created_at >= $3
      `,
      [ip, eventType, since]
    );

    const count = Number(result.rows[0]?.count ?? 0);
    return {
      suspicious: count >= threshold,
      count,
    };
  } catch (err) {
    console.error('[security-logging] Failed to check suspicious activity:', err);
    return { suspicious: false, count: 0 };
  }
}

