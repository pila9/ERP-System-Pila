"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardQuerySchema = exports.reportQuerySchema = void 0;
const zod_1 = require("zod");
exports.reportQuerySchema = zod_1.z.object({
    dateFrom: zod_1.z.string().date().optional(),
    dateTo: zod_1.z.string().date().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
});
exports.dashboardQuerySchema = zod_1.z.object({
    dateFrom: zod_1.z.string().date().optional(),
    dateTo: zod_1.z.string().date().optional(),
});
//# sourceMappingURL=report.validators.js.map