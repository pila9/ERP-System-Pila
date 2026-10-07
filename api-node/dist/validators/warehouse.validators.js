"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warehouseQuerySchema = exports.updateWarehouseSchema = exports.createWarehouseSchema = void 0;
const zod_1 = require("zod");
exports.createWarehouseSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50),
    name: zod_1.z.string().min(2).max(100),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(100).optional(),
    phone: zod_1.z.string().max(20).optional(),
    manager: zod_1.z.string().max(100).optional(),
    isDefault: zod_1.z.boolean().default(false),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateWarehouseSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50).optional(),
    name: zod_1.z.string().min(2).max(100).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(100).optional(),
    phone: zod_1.z.string().max(20).optional(),
    manager: zod_1.z.string().max(100).optional(),
    isDefault: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.warehouseQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    isDefault: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.string().default('name'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
//# sourceMappingURL=warehouse.validators.js.map