"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerQuerySchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
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
    creditLimit: zod_1.z.number().nonnegative().default(0),
    paymentTermsDays: zod_1.z.number().int().nonnegative().default(30),
    notes: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateCustomerSchema = zod_1.z.object({
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
    creditLimit: zod_1.z.number().nonnegative().optional(),
    paymentTermsDays: zod_1.z.number().int().nonnegative().optional(),
    notes: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.customerQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['name', 'code', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=customer.validators.js.map