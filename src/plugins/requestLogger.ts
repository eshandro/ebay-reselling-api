import type { FastifyPluginAsync } from 'fastify';

/**
 * Exact route patterns that should never produce a log line on success.
 * Matched against the registered route pattern, not the raw URL.
 *
 * Typical candidates: load-balancer / uptime health checks that fire
 * every few seconds and add noise without diagnostic value.
 */
const SILENT_ROUTES = new Set(['/health']);

/**
 * File extensions that are considered static assets and suppressed on success.
 * Covers JS bundles, stylesheets, fonts, images, and source maps — the bulk
 * of the noise when loading a Swagger UI or any SPA served by the app.
 *
 * Errors (4xx/5xx) on these requests are always logged regardless.
 */
const SILENT_EXTENSIONS = new Set([
  '.js',
  '.css',
  '.ico',
  '.png',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.map',
]);

/**
 * Derives the appropriate pino log level from an HTTP status code.
 *
 *  5xx → error  (server fault, should alert)
 *  4xx → warn   (client fault, worth tracking but not paging)
 *  2xx/3xx → info
 */
function levelFromStatus(statusCode: number): 'info' | 'warn' | 'error' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Returns the file extension from a URL path, stripping any query string.
 * Returns an empty string if there is no extension.
 */
function urlExtension(url: string): string {
  const path = url.split('?')[0] ?? '';
  const dot = path.lastIndexOf('.');
  return dot !== -1 ? path.slice(dot) : '';
}

/**
 * Returns true when a request should be suppressed (not logged).
 * Errors always break through suppression — a 500 on a .js file is still useful.
 */
function isSuppressed(routePath: string, url: string, statusCode: number): boolean {
  if (statusCode >= 400) return false;
  if (SILENT_ROUTES.has(routePath)) return true;
  if (SILENT_EXTENSIONS.has(urlExtension(url))) return true;
  return false;
}

const requestLoggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onResponse', (req, reply, done) => {
    // req.routeOptions.url is the registered pattern e.g. '/health',
    // falling back to req.url for safety (e.g. unmatched routes / 404s).
    const routePath = req.routeOptions?.url ?? req.url;
    const statusCode = reply.statusCode;

    if (isSuppressed(routePath, req.url, statusCode)) return done();

    const level = levelFromStatus(statusCode);

    req.log[level](
      {
        method: req.method,
        url: req.url,
        route: routePath,
        statusCode,
        ms: Math.round(reply.elapsedTime),
      },
      'request completed',
    );

    done();
  });
};

export default requestLoggerPlugin;
