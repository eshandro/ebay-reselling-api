# eBay Reselling API (Fastify + TypeScript)

A lightweight API that proxies eBay endpoints with proper OAuth, starting with Sell (orders/inventory).

## Quick start

1. Ensure Node 24+

Using fnm (recommended):

```bash
curl -fsSL https://fnm.vercel.app/install | bash
exec $SHELL
fnm install 24
fnm use 24
```

2. Install deps

```bash
pnpm install
```

3. Configure env

Copy `.env.example` to `.env` and fill values.

4. Run dev server

```bash
pnpm dev
```

Visit http://localhost:3002/docs for Swagger UI.

## Environment

- EBAY_ENV: sandbox | production
- EBAY_CLIENT_ID / EBAY_CLIENT_SECRET: from eBay Developer Portal
- EBAY_APP_SCOPES / EBAY_USER_SCOPES: space-separated scopes
- EBAY_RUNAME: eBay Redirect URI name (for user auth in future)

Notes on eBay OAuth:

- Application token (client credentials) is fetched from `/identity/v1/oauth2/token` using Basic auth and scopes.
- Many Sell APIs require a user access token tied to a seller account. For that, you’ll need a RUName (Redirect URI name configured in the eBay Dev Portal; it must match the callback you use) and implement the authorization code + refresh flow.

## Scripts

- `pnpm dev` – run with live reload (tsx)
- `pnpm build` – bundle with tsup
- `pnpm start` – run built server
- `pnpm test` – vitest
- `pnpm lint` – eslint

## Deploy

- Local: Node 20+, port 3002
- AWS: package with tsup; use @fastify/aws-lambda adapter or run in a container

## License

TBD
