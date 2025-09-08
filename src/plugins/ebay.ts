import type { FastifyPluginAsync } from 'fastify';
import { EbayClient } from '../ebay/client.js';
import { env } from '../config/env.js';

const ebayPlugin: FastifyPluginAsync = async (fastify) => {
  const client = new EbayClient(env.EBAY_ENV);
  fastify.decorate('ebay', client);
};

export default ebayPlugin;
