export const listOrdersQuery = {
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 200 },
    offset: { type: 'integer', minimum: 0 },
  },
} as const;

export const getInventoryParams = {
  type: 'object',
  properties: { sku: { type: 'string', minLength: 1 } },
  required: ['sku'],
} as const;
