export type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  timeoutMs?: number;
  retry?: number;
};

export async function fetchWithRetry(url: string, opts: FetchOptions = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeoutMs = 15_000,
    retry = 2,
  } = opts;

  for (let attempt = 0; attempt <= retry; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, body, signal: controller.signal });

      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        // Retry with backoff
        if (attempt < retry) {
          const ra = res.headers.get('retry-after');
          const retryAfter = ra ? Number(ra) * 1000 : 2 ** attempt * 500;
          await new Promise((r) => setTimeout(r, retryAfter));
          continue;
        }
      }
      clearTimeout(timeout);
      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt >= retry) throw err;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 300));
    }
  }
  throw new Error('unreachable');
}
