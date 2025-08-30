export type EbayEnv = 'sandbox' | 'production';

export const EBAY_BASE = {
  sandbox: 'https://api.sandbox.ebay.com',
  production: 'https://api.ebay.com',
} as const;

export const EBAY_AUTH_TOKEN_URL = (env: EbayEnv) => `${EBAY_BASE[env]}/identity/v1/oauth2/token`;
export const EBAY_AUTH_AUTHORIZE_URL = 'https://auth.ebay.com/oauth2/authorize';

// Common scopes
export const SCOPE_BASE = 'https://api.ebay.com/oauth/api_scope';

// Read-only Sell scopes for initial data access
export const SELL_READONLY_SCOPES = [
  `${SCOPE_BASE}/sell.inventory.readonly`,
  `${SCOPE_BASE}/sell.fulfillment.readonly`,
  `${SCOPE_BASE}/sell.account.readonly`,
  `${SCOPE_BASE}/sell.marketing.readonly`,
  `${SCOPE_BASE}/sell.analytics.readonly`,
];

export const SELL_ALL_SCOPES = [
  SCOPE_BASE,
  // Inventory
  `${SCOPE_BASE}/sell.inventory`,
  `${SCOPE_BASE}/sell.inventory.readonly`,
  // Fulfillment (orders)
  `${SCOPE_BASE}/sell.fulfillment`,
  `${SCOPE_BASE}/sell.fulfillment.readonly`,
  // Account
  `${SCOPE_BASE}/sell.account`,
  `${SCOPE_BASE}/sell.account.readonly`,
  // Marketing
  `${SCOPE_BASE}/sell.marketing`,
  `${SCOPE_BASE}/sell.marketing.readonly`,
  // Analytics
  `${SCOPE_BASE}/sell.analytics`,
  `${SCOPE_BASE}/sell.analytics.readonly`,
];

export const EBAY_SELL_ENDPOINTS = (env: EbayEnv) => ({
  orders: `${EBAY_BASE[env]}/sell/fulfillment/v1/order`,
  inventoryItems: `${EBAY_BASE[env]}/sell/inventory/v1/inventory_item`,
});
