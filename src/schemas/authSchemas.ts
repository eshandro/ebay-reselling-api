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

export const callbackBody = z.object({
  code: z.string().min(1),
  redirectUri: z.string().min(1),
});

export const callbackResponse = {
  200: z.object({
    accessTokenPreview: z.string(),
    hasRefreshToken: z.boolean(),
  }),
};
