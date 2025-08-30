import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3002'),
  EBAY_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  EBAY_CLIENT_ID: z.string().min(1, 'EBAY_CLIENT_ID is required'),
  EBAY_CLIENT_SECRET: z.string().min(1, 'EBAY_CLIENT_SECRET is required'),
  // RUName is the "Redirect URI value" from eBay Dev Portal (not a URL by itself)
  EBAY_RUNAME: z.string().optional(),
  // Space-separated scopes for application (client credentials) token if needed
  EBAY_APP_SCOPES: z.string().optional(),
  // Space-separated scopes for user access token (authorization code/refresh)
  EBAY_USER_SCOPES: z
    .string()
    .optional()
    .describe('Space-separated eBay Sell API scopes'),
  // Optional pre-obtained refresh token for seller account
  EBAY_REFRESH_TOKEN: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  // Fail fast with clear message
  throw new Error(`Invalid environment variables:\n${msg}`);
}

export const env = parsed.data;
