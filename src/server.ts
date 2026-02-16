import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Autoload from '@fastify/autoload';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const port = Number(env.PORT ?? '3002');

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
    level: env.LOG_LEVEL ?? 'info',
  },
  disableRequestLogging: true,
});

// Add Zod Validation Support
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// Register Plugins - loaded first and are available to all routes
await server.register(Autoload, {
  dir: join(__dirname, 'plugins'),
  encapsulate: false, // Makes plugins available globally
});

// Register Routes, e.g src/routes/auth.ts -> /auth
await server.register(Autoload, {
  dir: join(__dirname, 'routes'),
  options: { prefix: '/' },
});

try {
  await server.ready();
  await server.listen({ port, host: '0.0.0.0' });
  server.log.info(
    `Server listening at http://localhost:${port}; docs at http://localhost:${port}/docs`,
  );
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

export { server };
