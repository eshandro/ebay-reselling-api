import Fastify, { type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';

import { env } from './config/env.js';
import { EbayClient } from './ebay/client.js';
import { SELL_ALL_SCOPES, EBAY_AUTH_AUTHORIZE_URL } from './ebay/constants.js';

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });
await server.register(swagger, {
  openapi: {
    info: { title: 'eBay Reselling API', version: '0.1.0' },
  },
});
await server.register(swaggerUi, { routePrefix: '/docs' });

server.get('/health', {
  schema: { response: { 200: z.object({ ok: z.literal(true) }) } },
}, async () => ({ ok: true }));

server.get('/auth/app-token', {
  schema: {
    summary: 'Fetch application token (sanitized)',
    response: {
      200: z.object({ tokenPreview: z.string(), expiresInHintSec: z.number() }),
    },
  },
}, async () => {
  const client = new EbayClient(env.EBAY_ENV);
  // We won’t return the raw token; just confirm we can fetch it
  const token = await client['tokenManager'].getApplicationToken(SELL_ALL_SCOPES);
  return { tokenPreview: token.slice(0, 6) + '...' + token.slice(-4), expiresInHintSec: 3600 };
});

server.get('/auth/authorize-url', {
  schema: {
    summary: 'Get eBay user authorization URL',
    response: { 200: z.object({ url: z.string().url() }) },
  },
}, async () => {
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
});

server.post('/auth/callback', {
  schema: {
    body: z.object({ code: z.string().min(1), redirectUri: z.string().min(1) }),
    response: { 200: z.object({ accessTokenPreview: z.string(), hasRefreshToken: z.boolean() }) },
  },
}, async (req) => {
  const { code, redirectUri } = req.body as { code: string; redirectUri: string };
  const { EbayTokenManager } = await import('./ebay/tokenManager.js');
  const tm = new EbayTokenManager(env.EBAY_ENV);
  const scopes = env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES;
  const t = await tm.exchangeCodeForUserToken(code, redirectUri, scopes);
  return { accessTokenPreview: t.token.slice(0, 6) + '...' + t.token.slice(-4), hasRefreshToken: !!t.refreshToken };
});

server.get('/sell/orders', {
  schema: {
    summary: 'List Sell orders (may require user token in production scenarios)',
    querystring: z.object({ limit: z.coerce.number().min(1).max(200).optional(), offset: z.coerce.number().min(0).optional() }),
  },
}, async (req: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>) => {
  const client = new EbayClient(env.EBAY_ENV);
  const data = await client.listOrders({ limit: req.query.limit, offset: req.query.offset });
  return data;
});

server.get('/sell/inventory/:sku', {
  schema: {
    summary: 'Get inventory item by SKU',
    params: z.object({ sku: z.string().min(1) }),
  },
}, async (req: FastifyRequest<{ Params: { sku: string } }>) => {
  const client = new EbayClient(env.EBAY_ENV);
  const data = await client.getInventoryItem(req.params.sku);
  return data;
});

const port = Number(env.PORT ?? '3002');
await server.ready();
await server.listen({ port, host: '0.0.0.0' });
server.log.info(`Server running at http://localhost:${port} (docs at /docs)`);

// Authorization helpers for user tokens
server.get('/auth/authorize-url', {
  schema: {
    summary: 'Get eBay user authorization URL',
    response: { 200: z.object({ url: z.string().url() }) },
  },
}, async () => {
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
});

server.post('/auth/callback', {
  schema: {
    body: z.object({ code: z.string().min(1), redirectUri: z.string().min(1) }),
    response: { 200: z.object({ accessTokenPreview: z.string(), hasRefreshToken: z.boolean() }) },
  },
}, async (req: FastifyRequest<{ Body: { code: string; redirectUri: string } }>) => {
  const { code, redirectUri } = req.body;
  const { EbayTokenManager } = await import('./ebay/tokenManager.js');
  const tm = new EbayTokenManager(env.EBAY_ENV);
  const scopes = env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES;
  const t = await tm.exchangeCodeForUserToken(code, redirectUri, scopes);
  return { accessTokenPreview: t.token.slice(0, 6) + '...' + t.token.slice(-4), hasRefreshToken: !!t.refreshToken };
});
