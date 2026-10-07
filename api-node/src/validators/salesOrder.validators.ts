import { z } from 'zod';

export const salesOrderItemSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid().nullable().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  unitCost: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().max(100).default(0),
  description: z.string().optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  warehouseId: z.string().uuid().nullable().optional(),
  orderDate: z.string().datetime().or(z.string().date()),
  expectedDate: z.string().datetime().or(z.string().date()).nullable().optional(),
  status: z.enum(['draft', 'confirmed', 'shipped', 'completed', 'cancelled']).default('draft'),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.number().nonnegative().default(0),
  shipping: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  reference: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1),
});

export const updateSalesOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().nullable().optional(),
  orderDate: z.string().datetime().or(z.string().date()).optional(),
  expectedDate: z.string().datetime().or(z.string().date()).nullable().optional(),
  status: z.enum(['draft', 'confirmed', 'shipped', 'completed', 'cancelled']).optional(),
  discountType: z.enum(['fixed', 'percentage']).optional(),
  discountValue: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  reference: z.string().optional(),
  items: z.array(salesOrderItemSchema).optional(),
});

export const salesOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'confirmed', 'shipped', 'completed', 'cancelled']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  sortBy: z.enum(['number', 'orderDate', 'grandTotal', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});