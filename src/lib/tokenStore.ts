import { readFile, writeFile } from 'node:fs/promises';
import { env } from '@config/env.js';
import { createLogger } from '@lib/logger.js';

const log = createLogger('tokenStore');

// Keyed by sellerId (e.g. 'default', 'seller123')
type TokenData = Record<string, string>;

/**
 * File-backed store for eBay refresh tokens, keyed by sellerId.
 *
 * This abstraction means the backing store can later be swapped for a
 * database (Postgres, Redis, etc.) without touching token-management code.
 *
 * The JSON file is read fresh on every operation so two in-process instances
 * always see the latest state without coordination overhead.
 */
export class TokenStore {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? env.TOKENS_FILE ?? '.tokens.json';
  }

  private async read(): Promise<TokenData> {
    try {
      const content = await readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as TokenData;
    } catch {
      // File doesn't exist yet or is empty — start with a clean slate
      return {};
    }
  }

  async saveRefreshToken(sellerId: string, refreshToken: string): Promise<void> {
    const data = await this.read();
    data[sellerId] = refreshToken;
    await writeFile(this.filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    log.info({ sellerId, file: this.filePath }, 'refresh token saved to token store');
  }

  async getRefreshToken(sellerId: string): Promise<string | undefined> {
    const data = await this.read();
    return data[sellerId];
  }

  async listSellers(): Promise<string[]> {
    const data = await this.read();
    return Object.keys(data);
  }
}
