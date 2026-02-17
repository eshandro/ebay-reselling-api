import cors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: true,
  });
});
