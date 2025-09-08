export const authorizeUrlResponse = {
  200: {
    type: 'object',
    properties: { url: { type: 'string', format: 'uri' } },
    required: ['url'],
  },
} as const;

export const appTokenResponse = {
  200: {
    type: 'object',
    properties: {
      tokenPreview: { type: 'string' },
      expiresInHintSec: { type: 'number' },
    },
    required: ['tokenPreview', 'expiresInHintSec'],
  },
} as const;

export const callbackBody = {
  type: 'object',
  properties: {
    code: { type: 'string', minLength: 1 },
    redirectUri: { type: 'string', minLength: 1 },
  },
  required: ['code', 'redirectUri'],
} as const;

export const callbackResponse = {
  200: {
    type: 'object',
    properties: {
      accessTokenPreview: { type: 'string' },
      hasRefreshToken: { type: 'boolean' },
    },
    required: ['accessTokenPreview', 'hasRefreshToken'],
  },
} as const;
