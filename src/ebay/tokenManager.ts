import { env } from '@config/env.js';
import { EBAY_AUTH_TOKEN_URL, type EbayEnv } from '@ebay/constants.js';
import { fetchWithRetry } from '@lib/http.js';
import { createLogger } from '@lib/logger.js';

const log = createLogger('tokenManager');

type TokenResponse = {
  access_token: string;
  token_type: 'Application Access Token' | 'User Access Token' | string;
  expires_in: number; // seconds
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

export class EbayTokenManager {
  private appToken?: { token: string; expiresAt: number };
  private userToken?: { token: string; expiresAt: number; refreshToken?: string };
  private readonly env: EbayEnv;

  constructor(ebayEnv: EbayEnv = env.EBAY_ENV) {
    this.env = ebayEnv;
  }

  private basicAuthHeader() {
    const creds = `${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`;
    const b64 = Buffer.from(creds, 'utf8').toString('base64');
    return `Basic ${b64}`;
  }

  private now() {
    return Math.floor(Date.now() / 1000);
  }

  private willExpire(expAt: number) {
    return this.now() > expAt - 60; // renew 60s early
  }

  async getApplicationToken(scopes?: string[]) {
    if (!this.appToken || this.willExpire(this.appToken.expiresAt)) {
      log.info({ env: this.env }, 'fetching new application token');
      const body = new URLSearchParams();
      body.set('grant_type', 'client_credentials');
      if (scopes && scopes.length) body.set('scope', scopes.join(' '));

      const res = await fetchWithRetry(EBAY_AUTH_TOKEN_URL(this.env), {
        method: 'POST',
        headers: {
          Authorization: this.basicAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      if (!res.ok) {
        const txt = await res.text();
        log.error({ status: res.status, env: this.env }, 'failed to fetch application token');
        throw new Error(`Failed to fetch app token: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as TokenResponse;
      this.appToken = {
        token: json.access_token,
        expiresAt: this.now() + (json.expires_in ?? 3600),
      };
      log.debug({ expiresIn: json.expires_in }, 'application token cached');
    } else {
      log.debug('returning cached application token');
    }
    return this.appToken.token;
  }

  // Authorization Code exchange (for future Sell user flows)
  async exchangeCodeForUserToken(code: string, redirectUri: string, scopes?: string[]) {
    log.info({ env: this.env }, 'exchanging authorization code for user token');
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    if (scopes?.length) body.set('scope', scopes.join(' '));

    const res = await fetchWithRetry(EBAY_AUTH_TOKEN_URL(this.env), {
      method: 'POST',
      headers: {
        Authorization: this.basicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const txt = await res.text();
      log.error({ status: res.status, env: this.env }, 'failed to exchange authorization code');
      throw new Error(`Failed to exchange auth code: ${res.status} ${txt}`);
    }
    const json = (await res.json()) as TokenResponse;
    this.userToken = {
      token: json.access_token,
      expiresAt: this.now() + (json.expires_in ?? 3600),
      refreshToken: json.refresh_token,
    };
    log.info({ hasRefreshToken: !!json.refresh_token }, 'user token obtained');
    return this.userToken;
  }

  async refreshUserToken(refreshToken: string, scopes?: string[]) {
    log.info({ env: this.env }, 'refreshing user token');
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);
    if (scopes?.length) body.set('scope', scopes.join(' '));

    const res = await fetchWithRetry(EBAY_AUTH_TOKEN_URL(this.env), {
      method: 'POST',
      headers: {
        Authorization: this.basicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const txt = await res.text();
      log.error({ status: res.status, env: this.env }, 'failed to refresh user token');
      throw new Error(`Failed to refresh user token: ${res.status} ${txt}`);
    }
    const json = (await res.json()) as TokenResponse;
    this.userToken = {
      token: json.access_token,
      expiresAt: this.now() + (json.expires_in ?? 3600),
      refreshToken,
    };
    log.debug({ expiresIn: json.expires_in }, 'user token refreshed and cached');
    return this.userToken;
  }
}
