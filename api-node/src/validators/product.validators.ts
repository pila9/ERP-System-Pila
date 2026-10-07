import { z } from 'zod';

export const createProductSchema = z.object({
  code: z.string().min(2).max(50),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  costPrice: z.number().nonnegative().default(0),
  salePrice: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().max(100).default(0),
  trackInventory: z.boolean().default(true),
  reorderLevel: z.number().nonnegative().default(0),
  reorderQuantity: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  costPrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().max(100).optional(),
  trackInventory: z.boolean().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  reorderQuantity: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'code', 'salePrice', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});