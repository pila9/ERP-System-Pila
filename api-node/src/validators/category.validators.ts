import { z } from 'zod';

export const createCategorySchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(2).max(100),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(2).max(100).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.coerce.boolean().optional(),
  includeChildren: z.coerce.boolean().default(false),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});