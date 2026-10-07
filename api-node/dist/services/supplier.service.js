"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierService = exports.SupplierService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const supplier_validators_1 = require("../validators/supplier.validators");
class SupplierService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, isActive, sortBy, sortOrder } = supplier_validators_1.supplierQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        const [suppliers, total] = await Promise.all([
            prisma_js_1.default.supplier.findMany({
                where,
                include: { _count: { select: { purchaseOrders: true } } },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.supplier.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(suppliers, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.supplier, id, { _count: { select: { purchaseOrders: true } } });
    }
    async create(data) {
        const existing = await prisma_js_1.default.supplier.findUnique({ where: { code: data.code } });
        if (existing)
            throw new errorHandler_js_1.AppError('Code already exists', 409);
        return prisma_js_1.default.supplier.create({ data });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.supplier, id);
        if (data.code) {
            const existing = await prisma_js_1.default.supplier.findUnique({ where: { code: data.code } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        return prisma_js_1.default.supplier.update({ where: { id }, data });
    }
    async delete(id) {
        const count = await prisma_js_1.default.purchaseOrder.count({ where: { supplierId: id } });
        if (count > 0)
            throw new errorHandler_js_1.AppError('Cannot delete supplier with purchase orders', 400);
        await prisma_js_1.default.supplier.delete({ where: { id } });
    }
}
exports.SupplierService = SupplierService;
exports.supplierService = new SupplierService();
//# sourceMappingURL=supplier.service.js.map