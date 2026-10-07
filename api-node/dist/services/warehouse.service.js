"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warehouseService = exports.WarehouseService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const warehouse_validators_1 = require("../validators/warehouse.validators");
class WarehouseService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, isActive, isDefault, sortBy, sortOrder } = warehouse_validators_1.warehouseQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        if (isDefault !== undefined)
            where.isDefault = isDefault;
        const [warehouses, total] = await Promise.all([
            prisma_js_1.default.warehouse.findMany({
                where,
                include: { _count: { select: { stockLevels: true } } },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.warehouse.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(warehouses, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.warehouse, id, { _count: { select: { stockLevels: true } } });
    }
    async create(data) {
        const existing = await prisma_js_1.default.warehouse.findUnique({ where: { code: data.code } });
        if (existing)
            throw new errorHandler_js_1.AppError('Code already exists', 409);
        if (data.isDefault) {
            await prisma_js_1.default.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
        }
        return prisma_js_1.default.warehouse.create({ data });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.warehouse, id);
        if (data.code) {
            const existing = await prisma_js_1.default.warehouse.findUnique({ where: { code: data.code } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        if (data.isDefault) {
            await prisma_js_1.default.warehouse.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
        }
        return prisma_js_1.default.warehouse.update({ where: { id }, data });
    }
    async delete(id) {
        const count = await prisma_js_1.default.stockLevel.count({ where: { warehouseId: id } });
        if (count > 0)
            throw new errorHandler_js_1.AppError('Cannot delete warehouse with stock levels', 400);
        await prisma_js_1.default.warehouse.delete({ where: { id } });
    }
}
exports.WarehouseService = WarehouseService;
exports.warehouseService = new WarehouseService();
//# sourceMappingURL=warehouse.service.js.map