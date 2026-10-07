import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().min(2).max(100),
  abbreviation: z.string().min(1).max(20),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateUnitSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  abbreviation: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const unitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});