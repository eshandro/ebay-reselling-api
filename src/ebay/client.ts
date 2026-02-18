import { env } from '@config/env.js';
import { EBAY_SELL_ENDPOINTS, SELL_ALL_SCOPES, type EbayEnv } from '@ebay/constants.js';
import { EbayTokenManager } from '@ebay/tokenManager.js';
import { fetchWithRetry } from '@lib/http.js';

export class EbayClient {
  private readonly env: EbayEnv;
  private readonly tokenManager: EbayTokenManager;

  constructor(ebayEnv: EbayEnv = env.EBAY_ENV) {
    this.env = ebayEnv;
    this.tokenManager = new EbayTokenManager(ebayEnv);
  }

  private async authHeader(scopes?: string[]) {
    // Prefer user token when a refresh token is configured (needed for many Sell APIs)
    if (env.EBAY_REFRESH_TOKEN) {
      const scopesToUse =
        scopes && scopes.length
          ? scopes
          : (env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES);
      const user = await this.tokenManager.refreshUserToken(env.EBAY_REFRESH_TOKEN, scopesToUse);
      return { Authorization: `Bearer ${user.token}` };
    }
    const token = await this.tokenManager.getApplicationToken(scopes);
    return { Authorization: `Bearer ${token}` };
  }

  // Orders list (Sell Fulfillment). Note: some Sell API operations require user tokens.
  async listOrders(params: { limit?: number; offset?: number; orderIds?: string[] }) {
    const base = EBAY_SELL_ENDPOINTS(this.env).orders;
    const sp = new URLSearchParams();
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.offset) sp.set('offset', String(params.offset));
    if (params.orderIds?.length) sp.set('orderIds', params.orderIds.join(','));
    const url = `${base}?${sp.toString()}`;

    const res = await fetchWithRetry(url, {
      headers: {
        ...(await this.authHeader()),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`eBay orders error: ${res.status} ${txt}`);
    }
    return (await res.json()) as unknown;
  }

  // Inventory items
  async getInventoryItem(sku: string) {
    const base = EBAY_SELL_ENDPOINTS(this.env).inventoryItems;
    const url = `${base}/${encodeURIComponent(sku)}`;
    const res = await fetchWithRetry(url, {
      headers: {
        ...(await this.authHeader()),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`eBay inventory error: ${res.status} ${txt}`);
    }
    return (await res.json()) as unknown;
  }
}
