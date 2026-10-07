import { z } from 'zod';

export const createUserSchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string().uuid().nullable().optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  roleId: z.string().uuid().nullable().optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  roleId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});