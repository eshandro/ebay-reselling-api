// scripts/check-test-env.js
import { existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

export function checkTestEnv() {
  const envTest = join(process.cwd(), '.env.test');
  const envTestExample = join(process.cwd(), '.env.test.example');

  if (!existsSync(envTest)) {
    if (existsSync(envTestExample)) {
      copyFileSync(envTestExample, envTest);
      console.log('.env.test was missing, copied from .env.test.example');
    } else {
      throw new Error('ERROR: .env.test and .env.test.example are both missing.');
    }
  }
}
