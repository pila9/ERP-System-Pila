import { z } from 'zod';

export const createCustomerSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  taxNumber: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  creditLimit: z.number().nonnegative().default(0),
  paymentTermsDays: z.number().int().nonnegative().default(30),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCustomerSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(200).optional(),
  company: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  taxNumber: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  creditLimit: z.number().nonnegative().optional(),
  paymentTermsDays: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'code', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});