"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierQuerySchema = exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
exports.createSupplierSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50),
    name: zod_1.z.string().min(2).max(200),
    company: zod_1.z.string().max(200).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().max(20).optional(),
    taxNumber: zod_1.z.string().max(50).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    state: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(100).optional(),
    postalCode: zod_1.z.string().max(20).optional(),
    paymentTermsDays: zod_1.z.number().int().nonnegative().default(30),
    bankName: zod_1.z.string().max(100).optional(),
    bankAccount: zod_1.z.string().max(100).optional(),
    notes: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateSupplierSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50).optional(),
    name: zod_1.z.string().min(2).max(200).optional(),
    company: zod_1.z.string().max(200).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().max(20).optional(),
    taxNumber: zod_1.z.string().max(50).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    state: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(100).optional(),
    postalCode: zod_1.z.string().max(20).optional(),
    paymentTermsDays: zod_1.z.number().int().nonnegative().optional(),
    bankName: zod_1.z.string().max(100).optional(),
    bankAccount: zod_1.z.string().max(100).optional(),
    notes: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.supplierQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['name', 'code', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=supplier.validators.js.map