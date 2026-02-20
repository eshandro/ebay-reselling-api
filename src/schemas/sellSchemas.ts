import { z } from 'zod';

export const listOrdersQuery = z.object({
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional(),
});

export const getInventoryParams = z.object({
  sku: z.string().min(1),
});
