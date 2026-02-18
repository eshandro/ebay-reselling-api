import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { listOrdersQuery, getInventoryParams } from '@schemas/sellSchemas.js';

const sellRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/orders',
    {
      schema: {
        summary: 'List Sell orders (may require user token in production scenarios)',
        querystring: listOrdersQuery,
      },
    },
    async (req: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>) => {
      const data = await fastify.ebay.listOrders({
        limit: req.query.limit,
        offset: req.query.offset,
      });
      return data;
    },
  );

  fastify.get(
    '/inventory/:sku',
    {
      schema: {
        summary: 'Get inventory item by SKU',
        params: getInventoryParams,
      },
    },
    async (req: FastifyRequest<{ Params: { sku: string } }>) => {
      const data = await fastify.ebay.getInventoryItem(req.params.sku);
      return data;
    },
  );
};

export default sellRoutes;
