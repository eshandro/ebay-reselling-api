import { env } from '@config/env.js';
import { EBAY_SELL_ENDPOINTS, SELL_ALL_SCOPES, type EbayEnv } from '@ebay/constants.js';
import { EbayTokenManager } from '@ebay/tokenManager.js';
import { fetchWithRetry } from '@lib/http.js';
import { createLogger } from '@lib/logger.js';
import { TokenStore } from '@lib/tokenStore.js';

const log = createLogger('ebayClient');

export class EbayClient {
  private readonly env: EbayEnv;
  private readonly tokenManager: EbayTokenManager;
  private readonly tokenStore: TokenStore;

  constructor(ebayEnv: EbayEnv = env.EBAY_ENV, tokenStore?: TokenStore) {
    this.env = ebayEnv;
    this.tokenManager = new EbayTokenManager(ebayEnv);
    this.tokenStore = tokenStore ?? new TokenStore();
  }

  /**
   * Builds an Authorization header for the given seller.
   *
   * Resolution order:
   *   1. EBAY_REFRESH_TOKEN env var (useful for CI / single-seller overrides)
   *   2. TokenStore keyed by sellerId (persisted across restarts)
   *   3. Application token via client-credentials (no user context — limited Sell API access)
   */
  private async authHeader(sellerId = 'default', scopes?: string[]) {
    const scopesToUse = scopes?.length
      ? scopes
      : (env.EBAY_USER_SCOPES?.split(' ').filter(Boolean) ?? SELL_ALL_SCOPES);

    const refreshToken =
      env.EBAY_REFRESH_TOKEN ?? (await this.tokenStore.getRefreshToken(sellerId));

    if (refreshToken) {
      const user = await this.tokenManager.refreshUserToken(refreshToken, scopesToUse);
      return { Authorization: `Bearer ${user.token}` };
    }

    const token = await this.tokenManager.getApplicationToken(scopes);
    return { Authorization: `Bearer ${token}` };
  }

  // Orders list (Sell Fulfillment). Note: some Sell API operations require user tokens.
  async listOrders(params: {
    limit?: number;
    offset?: number;
    orderIds?: string[];
    sellerId?: string;
  }) {
    log.info({ params }, 'listing eBay orders');
    const base = EBAY_SELL_ENDPOINTS(this.env).orders;
    const sp = new URLSearchParams();
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.offset) sp.set('offset', String(params.offset));
    if (params.orderIds?.length) sp.set('orderIds', params.orderIds.join(','));
    const url = `${base}?${sp.toString()}`;

    const res = await fetchWithRetry(url, {
      headers: {
        ...(await this.authHeader(params.sellerId)),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      log.error({ status: res.status }, 'eBay orders request failed');
      throw new Error(`eBay orders error: ${res.status} ${txt}`);
    }
    log.debug('eBay orders fetched successfully');
    return (await res.json()) as unknown;
  }

  // Inventory items
  async getInventoryItem(sku: string, sellerId?: string) {
    log.info({ sku }, 'fetching eBay inventory item');
    const base = EBAY_SELL_ENDPOINTS(this.env).inventoryItems;
    const url = `${base}/${encodeURIComponent(sku)}`;
    const res = await fetchWithRetry(url, {
      headers: {
        ...(await this.authHeader(sellerId)),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      log.error({ status: res.status, sku }, 'eBay inventory request failed');
      throw new Error(`eBay inventory error: ${res.status} ${txt}`);
    }
    log.debug({ sku }, 'eBay inventory item fetched successfully');
    return (await res.json()) as unknown;
  }
}
