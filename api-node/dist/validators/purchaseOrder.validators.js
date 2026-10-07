"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseOrderQuerySchema = exports.updatePurchaseOrderSchema = exports.createPurchaseOrderSchema = exports.purchaseOrderItemSchema = void 0;
const zod_1 = require("zod");
exports.purchaseOrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    unitCost: zod_1.z.number().nonnegative().optional(),
    discount: zod_1.z.number().nonnegative().default(0),
    taxRate: zod_1.z.number().nonnegative().max(100).default(0),
    description: zod_1.z.string().optional(),
});
exports.createPurchaseOrderSchema = zod_1.z.object({
    supplierId: zod_1.z.string().uuid(),
    warehouseId: zod_1.z.string().uuid().nullable().optional(),
    orderDate: zod_1.z.string().datetime().or(zod_1.z.string().date()),
    expectedDate: zod_1.z.string().datetime().or(zod_1.z.string().date()).nullable().optional(),
    status: zod_1.z.enum(['draft', 'ordered', 'received', 'cancelled']).default('draft'),
    discountType: zod_1.z.enum(['fixed', 'percentage']).default('fixed'),
    discountValue: zod_1.z.number().nonnegative().default(0),
    shipping: zod_1.z.number().nonnegative().default(0),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.purchaseOrderItemSchema).min(1),
});
exports.updatePurchaseOrderSchema = zod_1.z.object({
    supplierId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid().nullable().optional(),
    orderDate: zod_1.z.string().datetime().or(zod_1.z.string().date()).optional(),
    expectedDate: zod_1.z.string().datetime().or(zod_1.z.string().date()).nullable().optional(),
    status: zod_1.z.enum(['draft', 'ordered', 'received', 'cancelled']).optional(),
    discountType: zod_1.z.enum(['fixed', 'percentage']).optional(),
    discountValue: zod_1.z.number().nonnegative().optional(),
    shipping: zod_1.z.number().nonnegative().optional(),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.purchaseOrderItemSchema).optional(),
});
exports.purchaseOrderQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    supplierId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['draft', 'ordered', 'received', 'cancelled']).optional(),
    dateFrom: zod_1.z.string().date().optional(),
    dateTo: zod_1.z.string().date().optional(),
    sortBy: zod_1.z.enum(['number', 'orderDate', 'grandTotal', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=purchaseOrder.validators.js.map