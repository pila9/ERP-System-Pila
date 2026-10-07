"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryQuerySchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    code: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(2).max(100),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateCategorySchema = zod_1.z.object({
    code: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(2).max(100).optional(),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.categoryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    includeChildren: zod_1.z.coerce.boolean().default(false),
    sortBy: zod_1.z.string().default('name'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
//# sourceMappingURL=category.validators.js.map