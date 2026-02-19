import pino from 'pino';
import { env } from '@config/env.js';

const isDev = env.NODE_ENV === 'development';

/**
 * Centralized pino logger instance.
 *
 * - Development: pretty-printed output via pino-pretty
 * - Production:  structured JSON (ready for Datadog, Sentry, etc.)
 *
 * Use `logger.child({ component: 'myModule' })` to create named sub-loggers.
 * Fastify's `server.log` / `req.log` are automatically children of this instance.
 */
export const logger = pino(
  {
    level: env.LOG_LEVEL,
  },
  isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);

/**
 * Creates a child logger with a `component` field stamped on every log line.
 * Use this instead of calling `logger.child()` directly.
 *
 * @example
 * const log = createLogger('tokenManager');
 * log.info('fetching token'); // => { component: 'tokenManager', msg: 'fetching token', ... }
 */
export function createLogger(component: string) {
  return logger.child({ component });
}
