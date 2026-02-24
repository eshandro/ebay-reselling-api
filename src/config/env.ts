import { z } from 'zod';
import dotenvFlow from 'dotenv-flow';

// Load .env, .env.local, and environment-specific files automatically
dotenvFlow.config({
  // Allow .env.local for local overrides; do not error if missing
  silent: true,
});

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3002'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  EBAY_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  EBAY_CLIENT_ID: z.string().min(1, 'EBAY_CLIENT_ID is required'),
  EBAY_CLIENT_SECRET: z.string().min(1, 'EBAY_CLIENT_SECRET is required'),
  // RUName is the "Redirect URI value" from eBay Dev Portal (not a URL by itself)
  EBAY_RUNAME: z.string().optional(),
  // Space-separated scopes for application (client credentials) token if needed
  EBAY_APP_SCOPES: z.string().optional(),
  // Space-separated scopes for user access token (authorization code/refresh)
  EBAY_USER_SCOPES: z.string().optional().describe('Space-separated eBay Sell API scopes'),
  // Optional pre-obtained refresh token for seller account
  EBAY_REFRESH_TOKEN: z.string().optional(),
  // Path to the local JSON file used to persist seller refresh tokens
  TOKENS_FILE: z.string().optional(),
  // Optional ngrok domain for local development redirects
  NGROK_DOMAIN: z.string().optional(),
});

// Helper to collapse whitespace/newlines in scope strings
function normalizeScopes(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/\\/g, '') // strip backslash line-continuation characters
    .split(/[\s\n\r]+/)
    .filter(Boolean)
    .join(' ');
}

// Normalize scope strings before validation
const normalized = {
  ...process.env,
  EBAY_APP_SCOPES: normalizeScopes(process.env.EBAY_APP_SCOPES),
  EBAY_USER_SCOPES: normalizeScopes(process.env.EBAY_USER_SCOPES),
};

const parsed = EnvSchema.safeParse(normalized);
if (!parsed.success) {
  const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  // Fail fast with clear message
  throw new Error(`Invalid environment variables:\n${msg}`);
}

export const env = parsed.data;
