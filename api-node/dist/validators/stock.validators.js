"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockMovementQuerySchema = exports.stockLevelQuerySchema = exports.stockMovementSchema = void 0;
const zod_1 = require("zod");
exports.stockMovementSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    warehouseId: zod_1.z.string().uuid(),
    toWarehouseId: zod_1.z.string().uuid().nullable().optional(),
    type: zod_1.z.enum(['in', 'out', 'transfer', 'adjustment', 'return']),
    quantity: zod_1.z.number().positive(),
    unitCost: zod_1.z.number().nonnegative().default(0),
    referenceId: zod_1.z.string().optional(),
    referenceType: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
exports.stockLevelQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    productId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    lowStock: zod_1.z.coerce.boolean().optional(),
});
exports.stockMovementQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    productId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(['in', 'out', 'transfer', 'adjustment', 'return']).optional(),
    dateFrom: zod_1.z.string().date().optional(),
    dateTo: zod_1.z.string().date().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'type', 'quantity']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=stock.validators.js.map