# Initial Setup Summary

Date: 2025-08-30

## Strategy snapshot

- Backend-first: Fastify + TypeScript service that proxies eBay APIs (FE-agnostic).
- Modern Node runtime: Node 24+, native fetch/URL, ESM, no dotenv (env via process.env).
- Start in eBay Sandbox; implement OAuth and Sell API reads (orders, inventory) first.
- Keep portable to AWS Lambda or containers later.

## Key decisions

- Framework: Fastify (performance, ecosystem) over edge-first (Hono) since AWS is likely.
- Auth: Implement both Application token (client credentials) and User token (auth code + refresh). Prefer user tokens for Sell APIs.
- Config: Strict TypeScript, NodeNext resolution, ES2023 target, zod for env validation.
- Tooling: pnpm, ESLint + Prettier, Vitest, Conventional Commits (commitlint + husky scaffold).
- Port: 3002. Package type: module (ESM).

## Implemented in this pass

- Project scaffolding and tooling
  - package.json: scripts (dev/build/start/test/lint), engines (node >=24), dev tools.
  - .eslintrc.cjs, .prettierrc, .gitignore, .node-version.
  - tsconfig.json: target ES2023, module/moduleResolution NodeNext, strict settings.
  - vitest.config.ts present but excluded from TS compile.
- eBay auth and client
  - src/config/env.ts: zod-validated env (no dotenv).
  - src/ebay/constants.ts: base URLs, scopes, and endpoints (sandbox/prod aware).
  - src/ebay/tokenManager.ts: client credentials, auth-code exchange, refresh; in-memory cache.
  - src/ebay/client.ts: Sell API calls; prefers user token when EBAY_REFRESH_TOKEN is set.
  - src/lib/http.ts: fetch with retry/backoff and timeout.
- Fastify server and routes
  - src/server.ts: CORS, Swagger, health.
  - GET /auth/app-token: sanity-check app token retrieval (returns preview only).
  - GET /auth/authorize-url: generates eBay login/consent URL (needs EBAY_RUNAME + scopes).
  - POST /auth/callback: exchanges authorization code; returns token previews.
  - GET /sell/orders: lists orders (requires user token in real use).
  - GET /sell/inventory/:sku: fetches inventory item by SKU.
- Docs
  - README updated with Node 24 via fnm, env setup, OAuth basics, and usage.
  - .env.example for reference (not used at runtime).

## Environment variables (set in shell)

- Required: EBAY_ENV (sandbox|production), EBAY_CLIENT_ID, EBAY_CLIENT_SECRET.
- Recommended for Sell APIs: EBAY_USER_SCOPES, EBAY_RUNAME, EBAY_REFRESH_TOKEN (after first consent).
- Optional: PORT (default 3002), NODE_ENV.

## eBay OAuth notes

- Application token: client_credentials grant at /identity/v1/oauth2/token (Basic auth + scopes).
- User token: authorization_code grant using RUName; store refresh token and use refresh_token grant to obtain short-lived access tokens for Sell APIs.

## Local development

- Node 24+ (fnm recommended). pnpm for install.
- Start dev: pnpm dev (Swagger at /docs).
- Conventional Commits: commitlint + husky hooks available once git is initialized.

## Known warnings and handling

- pnpm install may show DEP0169 (url.parse) from transitive deps; benign. Consider overrides/updates if you want a clean log.
- pnpm approve-builds may be required to allow postinstall scripts (e.g., esbuild) depending on your config.

## Next steps

- Acquire seller refresh token via /auth/authorize-url + /auth/callback; export EBAY_REFRESH_TOKEN.
- Expand Sell endpoints (order details, inventory search, listings).
- Add tests (unit/integration) and error mapping for eBay responses.
- Add OpenAPI schemas for all routes and typed responses.
- Prepare AWS packaging (lambda adapter or container) and basic CI.
