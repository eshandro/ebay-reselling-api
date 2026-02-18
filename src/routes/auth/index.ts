import type { FastifyPluginAsync } from 'fastify';
import { env } from '@config/env.js';
import { SELL_ALL_SCOPES, EBAY_AUTH_AUTHORIZE_URL } from '@ebay/constants.js';
import { EbayTokenManager } from '@ebay/tokenManager.js';
import {
  appTokenResponse,
  authorizeUrlResponse,
  callbackBody,
  callbackResponse,
} from '@schemas/authSchemas.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
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
      const url = `${EBAY_AUTH_AUTHORIZE_URL}?${sp.toString()}`;
      return { url };
    },
  );

  fastify.post(
    '/callback',
    {
      schema: {
        body: callbackBody,
        response: callbackResponse,
      },
    },
    async (req) => {
      const { code, redirectUri } = req.body as { code: string; redirectUri: string };
      const tm = new EbayTokenManager(env.EBAY_ENV);
      const scopes = env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES;
      const t = await tm.exchangeCodeForUserToken(code, redirectUri, scopes);
      return {
        accessTokenPreview: t.token.slice(0, 6) + '...' + t.token.slice(-4),
        hasRefreshToken: !!t.refreshToken,
      };
    },
  );
};

export default authRoutes;
