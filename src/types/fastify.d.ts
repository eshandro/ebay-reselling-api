import 'fastify';
import type { EbayClient } from '@ebay/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    ebay: EbayClient;
  }
}
