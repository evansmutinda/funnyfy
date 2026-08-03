// Combined middleware helpers for API endpoints

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, setSecurityHeaders, getClientIp } from './security';
import { requireAuth } from './auth';
import { validateBody, generateRequestSchema } from './validation';
import { sanitizeString, sanitizeUrl } from './security';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

// Apply standard middleware (CORS, security headers, OPTIONS handling)
export function applyMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[] = ['GET', 'POST', 'OPTIONS']
): boolean {
  // Set security headers
  setSecurityHeaders(res);
  
  // Set CORS headers
  setCorsHeaders(res, allowedOrigin);

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Stop processing
  }

  // Check method
  if (!allowedMethods.includes(req.method || '')) {
    res.status(405).json({
      ok: false,
      error: `Method ${req.method} not allowed. Allowed: ${allowedMethods.join(', ')}`
    });
    return false; // Stop processing
  }

  return true; // Continue processing
}

// Parse and validate request body
export function parseBody(req: VercelRequest): { success: true; data: any } | { success: false; error: string; status: number } {
  let body: any = {};
  
  try {
    if (typeof req.body === 'string') {
      body = req.body ? JSON.parse(req.body) : {};
    } else if (req.body) {
      body = req.body;
    }
  } catch (err) {
    return {
      success: false,
      error: 'Invalid JSON in request body',
      status: 400
    };
  }

  return { success: true, data: body };
}

// Validate generation request
export function validateGenerateRequest(body: any): { success: true; data: { styleId: string; imageUrl: string } } | { success: false; error: string } {
  const validation = validateBody(generateRequestSchema, body);
  
  if (!validation.success) {
    return validation;
  }

  // Additional sanitization
  const styleId = sanitizeString(validation.data.styleId);
  const imageUrl = sanitizeUrl(validation.data.imageUrl);

  if (!imageUrl) {
    return {
      success: false,
      error: 'Invalid image URL format'
    };
  }

  return {
    success: true,
    data: { styleId, imageUrl }
  };
}

// Get request metadata (IP, user agent, etc.)
export function getRequestMetadata(req: VercelRequest) {
  return {
    ip: getClientIp(req),
    userAgent: (req.headers['user-agent'] || 'unknown').slice(0, 500), // Limit length
    origin: req.headers['origin'] || 'unknown'
  };
}
