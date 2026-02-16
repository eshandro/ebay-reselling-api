// scripts/pretest-env.js
// Ensures .env.test exists before running tests. If missing, copies from .env.test.example.
import { checkTestEnv } from './check-test-env.js';

try {
  checkTestEnv();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
