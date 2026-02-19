# GitHub Copilot Instructions

You are an expert TypeScript developer working in a TypeScript project using Fastify, Vitest, and modern Node.js (v24+).

## Project Overview

- **Runtime**: Node.js (ESM, `type": "module"`).
- **Language**: TypeScript (set to `NodeNext` module resolution).
- **Framework**: Fastify with `@fastify/type-provider-zod`.
- **Testing**: Vitest.

## Import & Module Rules

1. **Extensions**: ALWAYS include the `.js` extension for all local imports (e.g., `import { foo } from './foo.js';`).
2. **Aliases**:
   - Use path aliases defined in `tsconfig.json` for source code (e.g., `@config/*`, `@ebay/*`, `@lib/*`, `@routes/*`).
   - Do NOT use relative paths like `../../` within the `src/` application code; prefer aliases.
3. **Tests**:
   - Tests must use **relative paths** for imports (e.g., `import { handler } from './index.js';`).
   - Do NOT use aliases inside test files that are checking the local module.

## Testing Standards

- **Colocation**: Tests are colocated with the source file they test (e.g., `server.ts` -> `server.test.ts`).
- **Framework**: Use `vitest` for all testing.
- **Structure**: describe/it/expect pattern.

## Code Style

- Use functional programming patterns where possible.
- Ensure strict type safety; avoid `any`.
- Zod schemas are used for request/response validation.
