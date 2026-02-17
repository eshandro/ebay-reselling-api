import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from './server.js';

describe('Server', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    if (server) await server.close();
  });

  it('health check returns 200', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it('swagger /docs is exposed', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/docs', // Swagger UI redirects
    });

    // It's usually a redirect (302) or HTML (200), depending on config
    expect(response.statusCode).toBeLessThan(400);
  });
});
