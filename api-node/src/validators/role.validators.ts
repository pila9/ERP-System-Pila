import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z_]+$/),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isSystem: z.boolean().default(false),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const roleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isSystem: z.coerce.boolean().optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});