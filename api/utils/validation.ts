// Input validation schemas using Zod

import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('Invalid user ID format');

// Style ID validation (alphanumeric, hyphens, lowercase)
export const styleIdSchema = z
  .string()
  .min(1, 'Style ID is required')
  .max(50, 'Style ID too long')
  .regex(/^[a-z0-9-]+$/, 'Style ID must be lowercase alphanumeric with hyphens only');

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'URL must use http or https protocol' }
  );

// Image generation request schema
export const generateRequestSchema = z.object({
  styleId: styleIdSchema,
  imageUrl: urlSchema,
  userId: uuidSchema.optional(), // Optional if passed in header
});

// User ID schema (for headers/query)
export const userIdSchema = uuidSchema;

// Subscription tier validation
export const tierSchema = z.enum(['starter', 'popular', 'pro'], {
  errorMap: () => ({ message: 'Invalid subscription tier' })
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Job status schema
export const jobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

// Validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed'
      };
    }
    return {
      success: false,
      error: 'Invalid request format'
    };
  }
}

// Validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): { success: true; data: T } | { success: false; error: string } {
  return validateBody(schema, query);
}
