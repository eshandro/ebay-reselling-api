import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from './http.js';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns successful response on first try', async () => {
    const mockResponse = new Response('{"data":"test"}', { status: 200 });
    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry('https://api.example.com/test');

    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 server error and eventually succeeds', async () => {
    const errorResponse = new Response('Server Error', { status: 500 });
    const successResponse = new Response('{"data":"test"}', { status: 200 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test', { retry: 2 });

    // Fast-forward through the retry delay
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 rate limit with exponential backoff', async () => {
    const rateLimitResponse = new Response('Too Many Requests', { status: 429 });
    const successResponse = new Response('{"data":"test"}', { status: 200 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test', { retry: 2 });

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('respects Retry-After header on 429 response', async () => {
    const rateLimitResponse = new Response('Too Many Requests', {
      status: 429,
      headers: { 'retry-after': '2' },
    });
    const successResponse = new Response('{"data":"test"}', { status: 200 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test', { retry: 2 });

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result.status).toBe(200);
  });

  it('throws after max retries exhausted', async () => {
    const errorResponse = new Response('Server Error', { status: 503 });

    global.fetch = vi.fn().mockResolvedValue(errorResponse);

    const promise = fetchWithRetry('https://api.example.com/test', { retry: 1 });

    await vi.runAllTimersAsync();

    const result = await promise;

    // It returns the last failed response after exhausting retries
    expect(result.status).toBe(503);
    expect(global.fetch).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('passes custom headers and method', async () => {
    const mockResponse = new Response('{"data":"test"}', { status: 200 });
    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await fetchWithRetry('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ test: 'data' }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify({ test: 'data' }),
      }),
    );
  });

  it('does not retry on 4xx client errors (except 429)', async () => {
    const notFoundResponse = new Response('Not Found', { status: 404 });

    global.fetch = vi.fn().mockResolvedValueOnce(notFoundResponse);

    const result = await fetchWithRetry('https://api.example.com/test', { retry: 2 });

    expect(result.status).toBe(404);
    expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
  });
});
