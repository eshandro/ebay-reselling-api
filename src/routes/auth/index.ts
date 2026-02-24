import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from '@config/env.js';
import { SELL_ALL_SCOPES, EBAY_AUTH_AUTHORIZE_URL } from '@ebay/constants.js';
import { EbayTokenManager } from '@ebay/tokenManager.js';
import { TokenStore } from '@lib/tokenStore.js';
import {
  appTokenResponse,
  authorizeUrlResponse,
  callbackQuery,
  callbackResponse,
} from '@schemas/authSchemas.js';

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/app-token',
    {
      schema: {
        summary: 'Fetch application token (sanitized)',
        response: appTokenResponse,
      },
    },
    async () => {
      const tm = new EbayTokenManager(env.EBAY_ENV);
      const token = await tm.getApplicationToken(SELL_ALL_SCOPES);
      return { tokenPreview: token.slice(0, 6) + '...' + token.slice(-4), expiresInHintSec: 3600 };
    },
  );

  fastify.get(
    '/authorize-url',
    {
      schema: {
        summary: 'Get eBay user authorization URL',
        response: authorizeUrlResponse,
      },
    },
    async () => {
      if (!env.EBAY_RUNAME) {
        throw new Error('EBAY_RUNAME is not configured');
      }
      const scopes = env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES;
      const sp = new URLSearchParams({
        client_id: env.EBAY_CLIENT_ID,
        redirect_uri: env.EBAY_RUNAME,
        response_type: 'code',
        scope: scopes.join(' '),
      });
      const url = `${EBAY_AUTH_AUTHORIZE_URL(env.EBAY_ENV)}?${sp.toString()}`;
      return { url };
    },
  );

  /**
   * eBay redirects the seller here after they grant consent.
   *
   * eBay sends a GET with:
   *   ?code=<auth_code>&expires_in=299[&state=<value>]
   *
   * This handler exchanges the code for tokens, persists the refresh token to
   * the TokenStore, and returns a confirmation the seller sees in their browser.
   *
   * Configure your RuName's Accept URL in the eBay Dev Portal to point here,
   * e.g. https://your-api.example.com/auth/callback
   */
  fastify.get(
    '/callback',
    {
      schema: {
        summary: 'eBay OAuth callback — exchanges authorization code for user tokens',
        querystring: callbackQuery,
        response: callbackResponse,
      },
    },
    async (req, reply) => {
      const { code, seller, error, error_description } = req.query;
      const sellerId = seller ?? 'default';

      // eBay sends an error redirect when something goes wrong (e.g. invalid scope, user declined)
      if (error || !code) {
        return reply.code(400).send({
          ok: false as const,
          error: error ?? 'missing_code',
          error_description,
        });
      }

      if (!env.EBAY_RUNAME) {
        throw new Error('EBAY_RUNAME is not configured');
      }

      const tm = new EbayTokenManager(env.EBAY_ENV);
      const scopes = env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES;
      const t = await tm.exchangeCodeForUserToken(code, env.EBAY_RUNAME, scopes);

      if (t.refreshToken) {
        const store = new TokenStore();
        await store.saveRefreshToken(sellerId, t.refreshToken);
      }

      return {
        ok: true as const,
        sellerId,
        accessTokenPreview: t.token.slice(0, 6) + '...' + t.token.slice(-4),
        hasRefreshToken: !!t.refreshToken,
      };
    },
  );
  /**
   * eBay redirects here if the seller clicks "Not now" on the consent page.
   */
  fastify.get(
    '/declined',
    {
      schema: {
        summary: 'eBay OAuth declined — seller did not grant consent',
        response: {
          200: z.object({
            ok: z.literal(false),
            message: z.string(),
          }),
        },
      },
    },
    async () => {
      return {
        ok: false as const,
        message:
          'Authorization was declined. Please try again and click "I Agree" to grant access.',
      };
    },
  );
};

export default authRoutes;
