import { z } from 'zod';

export const authorizeUrlResponse = {
  200: z.object({
    url: z.url(),
  }),
};

export const appTokenResponse = {
  200: z.object({
    tokenPreview: z.string(),
    expiresInHintSec: z.number(),
  }),
};

// Query parameters eBay sends to the Accept URL on redirect.
// eBay sends either `code` (success) or `error`+`error_description` (failure).
export const callbackQuery = z.object({
  code: z.string().min(1).optional(),
  state: z.string().optional(),
  expires_in: z.coerce.number().optional(),
  // eBay error redirect fields
  error: z.string().optional(),
  error_description: z.string().optional(),
  // Optional: which seller this consent is for (defaults to 'default')
  seller: z.string().optional(),
});

export const callbackResponse = {
  200: z.object({
    ok: z.literal(true),
    sellerId: z.string(),
    accessTokenPreview: z.string(),
    hasRefreshToken: z.boolean(),
  }),
  400: z.object({
    ok: z.literal(false),
    error: z.string(),
    error_description: z.string().optional(),
  }),
};
