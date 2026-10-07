"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleQuerySchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    slug: zod_1.z.string().min(2).max(50).regex(/^[a-z_]+$/),
    description: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
    isSystem: zod_1.z.boolean().default(false),
});
exports.updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    description: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.roleQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    isSystem: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.string().default('name'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
//# sourceMappingURL=role.validators.js.map