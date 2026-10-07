"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitQuerySchema = exports.updateUnitSchema = exports.createUnitSchema = void 0;
const zod_1 = require("zod");
exports.createUnitSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    abbreviation: zod_1.z.string().min(1).max(20),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateUnitSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    abbreviation: zod_1.z.string().min(1).max(20).optional(),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.unitQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.string().default('name'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
//# sourceMappingURL=unit.validators.js.map