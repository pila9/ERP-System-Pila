import { z } from 'zod';

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid().nullable().optional(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment', 'return']),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().default(0),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  note: z.string().optional(),
});

export const stockLevelQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const stockMovementQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment', 'return']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  sortBy: z.enum(['createdAt', 'type', 'quantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});