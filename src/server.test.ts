import fastify from 'fastify';
import { describe, it, expect } from 'vitest';

// Smoke test for server creation

describe('server bootstrap', () => {
  it('creates a fastify instance', () => {
    const app = fastify();
    expect(app).toBeDefined();
  });
});
