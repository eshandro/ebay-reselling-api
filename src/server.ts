import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env } from './config/env.js';
import ebayPlugin from './plugins/ebay.js';
import authRoutes from './routes/auth.js';
import sellRoutes from './routes/sell.js';

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });
await server.register(swagger, {
  openapi: {
    info: { title: 'eBay Reselling API', version: '0.1.0' },
  },
});
await server.register(swaggerUi, { routePrefix: '/docs' });

server.get(
  '/health',
  {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: { ok: { const: true } },
          required: ['ok'],
        },
      },
    },
  },
  async () => ({ ok: true }),
);

await server.register(ebayPlugin);
await server.register(authRoutes, { prefix: '/auth' });
await server.register(sellRoutes, { prefix: '/sell' });

const port = Number(env.PORT ?? '3002');
await server.ready();
await server.listen({ port, host: '0.0.0.0' });
server.log.info(`Server running at http://localhost:${port} (docs at /docs)`);
