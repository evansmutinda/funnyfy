// Security utilities: headers, validation, sanitization

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

// Set security headers
export function setSecurityHeaders(res: VercelResponse) {
  // HTTPS enforcement (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', buildContentSecurityPolicy());
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function buildContentSecurityPolicy(options?: { allowInlineScripts?: boolean }): string {
  const scriptSrc = options?.allowInlineScripts ? "script-src 'self' 'unsafe-inline'; " : "script-src 'self'; ";
  return (
    "default-src 'self'; " +
    "img-src 'self' data: https:; " +
    scriptSrc +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https:;"
  );
}

/** Admin login/dashboard HTML embed inline scripts; allow them on those pages only. */
export function setAdminPageSecurityHeaders(res: VercelResponse) {
  setSecurityHeaders(res);
  res.setHeader('Content-Security-Policy', buildContentSecurityPolicy({ allowInlineScripts: true }));
}

// Set CORS headers (with security)
export function setCorsHeaders(res: VercelResponse, allowedOrigin: string = '*') {
  const origin = allowedOrigin === '*' ? '*' : allowedOrigin;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

// Sanitize string input (basic XSS prevention)
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Max length
}

// Sanitize URL — accepts https:// URLs and base64 data URLs (for image uploads)
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;

  // Allow base64 data URLs for image uploads
  if (url.startsWith('data:image/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Limit length for regular URLs
    if (url.length > 2048) return null;
    return url;
  } catch {
    return null;
  }
}

// Extract and verify JWT token
export function verifyJWT(token: string): { userId: string; email?: string } | null {
  if (!JWT_SECRET) {
    console.warn('[security] JWT_SECRET not set, JWT verification disabled');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; sub?: string };
    
    // Support both 'userId' and 'sub' claims
    const userId = decoded.userId || decoded.sub;
    if (!userId) return null;
    
    return {
      userId,
      email: decoded.email
    };
  } catch (err) {
    return null;
  }
}

// Extract userId from request (supports multiple methods)
export function extractUserId(req: VercelRequest): string | null {
  const isProduction = process.env.NODE_ENV === 'production';

  // Method 1: JWT token in Authorization header (Secure - Allowed everywhere)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyJWT(token);
    if (decoded) {
      return decoded.userId;
    }
  }

  // Fallback methods (Insecure - Only allowed in development/testing environments)
  if (!isProduction) {
    // Method 2: X-User-Id header
    const headerUserId = req.headers['x-user-id'] as string;
    if (headerUserId) {
      return sanitizeString(headerUserId);
    }

    // Method 3: userId in body (for POST requests)
    if (req.body && typeof req.body === 'object' && req.body.userId) {
      return sanitizeString(String(req.body.userId));
    }

    // Method 4: userId in query (for GET requests)
    if (req.query && req.query.userId) {
      return sanitizeString(String(req.query.userId));
    }
  }

  return null;
}

// Get client IP address
export function getClientIp(req: VercelRequest): string {
  const xfwd = (req.headers['x-forwarded-for'] || '') as string;
  if (xfwd) {
    return xfwd.split(',')[0].trim();
  }
  return (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'unknown';
}

// Safe error response (doesn't leak internal details)
export function safeErrorResponse(
  res: VercelResponse,
  status: number,
  error: string,
  detail?: string
) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(status).json({
    ok: false,
    error,
    ...(isDevelopment && detail ? { detail } : {})
  });
}

// Rate limit key generator
export function getRateLimitKey(identifier: string, endpoint: string): string {
  const minute = Math.floor(Date.now() / 60000); // Current minute
  return `rate_limit:${endpoint}:${identifier}:${minute}`;
}
