import fp from 'fastify-plugin';
import { EbayClient } from '../ebay/client.js';
import { env } from '../config/env.js';

export default fp(async (fastify) => {
  const client = new EbayClient(env.EBAY_ENV);
  fastify.decorate('ebay', client);
});
