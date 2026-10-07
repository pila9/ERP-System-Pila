"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productQuerySchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50),
    sku: zod_1.z.string().max(50).optional(),
    barcode: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().nullable().optional(),
    unitId: zod_1.z.string().uuid().nullable().optional(),
    costPrice: zod_1.z.number().nonnegative().default(0),
    salePrice: zod_1.z.number().nonnegative().default(0),
    taxRate: zod_1.z.number().nonnegative().max(100).default(0),
    trackInventory: zod_1.z.boolean().default(true),
    reorderLevel: zod_1.z.number().nonnegative().default(0),
    reorderQuantity: zod_1.z.number().nonnegative().default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateProductSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50).optional(),
    sku: zod_1.z.string().max(50).optional(),
    barcode: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(2).max(200).optional(),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().nullable().optional(),
    unitId: zod_1.z.string().uuid().nullable().optional(),
    costPrice: zod_1.z.number().nonnegative().optional(),
    salePrice: zod_1.z.number().nonnegative().optional(),
    taxRate: zod_1.z.number().nonnegative().max(100).optional(),
    trackInventory: zod_1.z.boolean().optional(),
    reorderLevel: zod_1.z.number().nonnegative().optional(),
    reorderQuantity: zod_1.z.number().nonnegative().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.productQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    unitId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    lowStock: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['name', 'code', 'salePrice', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=product.validators.js.map