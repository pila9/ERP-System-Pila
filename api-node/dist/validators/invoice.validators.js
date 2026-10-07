"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = exports.invoiceQuerySchema = exports.updateInvoiceSchema = exports.createInvoiceSchema = exports.invoiceItemSchema = void 0;
const zod_1 = require("zod");
exports.invoiceItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid().nullable().optional(),
    salesOrderItemId: zod_1.z.string().uuid().nullable().optional(),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().positive().default(1),
    unitPrice: zod_1.z.number().nonnegative(),
    discount: zod_1.z.number().nonnegative().default(0),
    taxRate: zod_1.z.number().nonnegative().max(100).default(0),
});
exports.createInvoiceSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    salesOrderId: zod_1.z.string().uuid().nullable().optional(),
    invoiceDate: zod_1.z.string().datetime().or(zod_1.z.string().date()),
    dueDate: zod_1.z.string().datetime().or(zod_1.z.string().date()).nullable().optional(),
    status: zod_1.z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).default('draft'),
    discountType: zod_1.z.enum(['fixed', 'percentage']).default('fixed'),
    discountValue: zod_1.z.number().nonnegative().default(0),
    shipping: zod_1.z.number().nonnegative().default(0),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.invoiceItemSchema).min(1),
});
exports.updateInvoiceSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid().optional(),
    salesOrderId: zod_1.z.string().uuid().nullable().optional(),
    invoiceDate: zod_1.z.string().datetime().or(zod_1.z.string().date()).optional(),
    dueDate: zod_1.z.string().datetime().or(zod_1.z.string().date()).nullable().optional(),
    status: zod_1.z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional(),
    discountType: zod_1.z.enum(['fixed', 'percentage']).optional(),
    discountValue: zod_1.z.number().nonnegative().optional(),
    shipping: zod_1.z.number().nonnegative().optional(),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.invoiceItemSchema).optional(),
});
exports.invoiceQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    customerId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional(),
    dateFrom: zod_1.z.string().date().optional(),
    dateTo: zod_1.z.string().date().optional(),
    sortBy: zod_1.z.enum(['number', 'invoiceDate', 'grandTotal', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.createPaymentSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().uuid().nullable().optional(),
    customerId: zod_1.z.string().uuid().nullable().optional(),
    amount: zod_1.z.number().positive(),
    paidAt: zod_1.z.string().datetime(),
    method: zod_1.z.enum(['cash', 'card', 'bank_transfer', 'check', 'other']).default('cash'),
    reference: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
//# sourceMappingURL=invoice.validators.js.map