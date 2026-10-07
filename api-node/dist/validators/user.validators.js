"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    code: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    roleId: zod_1.z.string().uuid().nullable().optional(),
    phone: zod_1.z.string().max(20).optional(),
    avatar: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateUserSchema = zod_1.z.object({
    code: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(2).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    roleId: zod_1.z.string().uuid().nullable().optional(),
    phone: zod_1.z.string().max(20).optional(),
    avatar: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.userQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    roleId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['name', 'email', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=user.validators.js.map