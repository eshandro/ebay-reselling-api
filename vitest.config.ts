// Ensure .env.test exists before Vitest runs
import { checkTestEnv } from './scripts/check-test-env.js';
checkTestEnv();

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    pool: 'forks',
    execArgv: ['--import', 'tsx'], // Use tsx for TS support with ESM
  },
});
