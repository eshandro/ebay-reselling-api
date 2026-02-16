import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        summary: 'Health Check',
        description: 'Returns 200 if the server is up',
        response: {
          200: z.object({
            ok: z.boolean().describe('Always true'),
          }),
        },
      },
    },
    async () => ({ ok: true }),
  );
};

export default healthRoute;
