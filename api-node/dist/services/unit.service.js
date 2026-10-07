"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitService = exports.UnitService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const unit_validators_1 = require("../validators/unit.validators");
class UnitService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, isActive, sortBy, sortOrder } = unit_validators_1.unitQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { abbreviation: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        const [units, total] = await Promise.all([
            prisma_js_1.default.unit.findMany({
                where,
                include: { _count: { select: { products: true } } },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.unit.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(units, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.unit, id, { _count: { select: { products: true } } });
    }
    async create(data) {
        const existing = await prisma_js_1.default.unit.findUnique({ where: { abbreviation: data.abbreviation } });
        if (existing)
            throw new errorHandler_js_1.AppError('Abbreviation already exists', 409);
        return prisma_js_1.default.unit.create({ data });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.unit, id);
        if (data.abbreviation) {
            const existing = await prisma_js_1.default.unit.findUnique({ where: { abbreviation: data.abbreviation } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Abbreviation already exists', 409);
        }
        return prisma_js_1.default.unit.update({ where: { id }, data });
    }
    async delete(id) {
        const count = await prisma_js_1.default.product.count({ where: { unitId: id } });
        if (count > 0)
            throw new errorHandler_js_1.AppError('Cannot delete unit with products', 400);
        await prisma_js_1.default.unit.delete({ where: { id } });
    }
}
exports.UnitService = UnitService;
exports.unitService = new UnitService();
//# sourceMappingURL=unit.service.js.map