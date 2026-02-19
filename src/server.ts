import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Autoload from '@fastify/autoload';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from '@config/env.js';
import { logger } from '@lib/logger.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const port = Number(env.PORT ?? '3002');

// Build and configure the Fastify server as a Factory for testing purposes
export async function buildServer() {
  const server = Fastify({
    loggerInstance: logger,
    // Built-in request logging is disabled in favour of the custom
    // requestLogger plugin (src/plugins/requestLogger.ts), which gives
    // us status-code-aware log levels and route-level suppression.
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

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // If server.ts is run directly, start the server
  const server = await buildServer();
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

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    server.log.info(`${signal} received, closing server gracefully`);
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
