import { z } from 'zod';

export const invoiceItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  salesOrderItemId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().max(100).default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  salesOrderId: z.string().uuid().nullable().optional(),
  invoiceDate: z.string().datetime().or(z.string().date()),
  dueDate: z.string().datetime().or(z.string().date()).nullable().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).default('draft'),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.number().nonnegative().default(0),
  shipping: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export const updateInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().nullable().optional(),
  invoiceDate: z.string().datetime().or(z.string().date()).optional(),
  dueDate: z.string().datetime().or(z.string().date()).nullable().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional(),
  discountType: z.enum(['fixed', 'percentage']).optional(),
  discountValue: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  sortBy: z.enum(['number', 'invoiceDate', 'grandTotal', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  paidAt: z.string().datetime(),
  method: z.enum(['cash', 'card', 'bank_transfer', 'check', 'other']).default('cash'),
  reference: z.string().optional(),
  note: z.string().optional(),
});