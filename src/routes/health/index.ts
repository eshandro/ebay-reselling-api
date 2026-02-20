import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const healthRoute: FastifyPluginAsyncZod = async (fastify) => {
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
