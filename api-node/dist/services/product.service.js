"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const product_validators_1 = require("../validators/product.validators");
class ProductService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, categoryId, unitId, isActive, lowStock, sortBy, sortOrder } = product_validators_1.productQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoryId)
            where.categoryId = categoryId;
        if (unitId)
            where.unitId = unitId;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (lowStock) {
            where.trackInventory = true;
            where.stockLevels = { some: { quantity: { lte: prisma_js_1.default.product.fields.reorderLevel } } };
        }
        const [products, total] = await Promise.all([
            prisma_js_1.default.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    unit: { select: { id: true, name: true, abbreviation: true } },
                    stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.product.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(products, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.product, id, {
            category: true,
            unit: true,
            stockLevels: { include: { warehouse: true } },
        });
    }
    async create(data) {
        const existing = await prisma_js_1.default.product.findUnique({ where: { code: data.code } });
        if (existing)
            throw new errorHandler_js_1.AppError('Code already exists', 409);
        if (data.sku) {
            const skuExists = await prisma_js_1.default.product.findUnique({ where: { sku: data.sku } });
            if (skuExists)
                throw new errorHandler_js_1.AppError('SKU already exists', 409);
        }
        if (data.barcode) {
            const barcodeExists = await prisma_js_1.default.product.findUnique({ where: { barcode: data.barcode } });
            if (barcodeExists)
                throw new errorHandler_js_1.AppError('Barcode already exists', 409);
        }
        if (data.categoryId)
            await this.findByIdOrThrow(prisma_js_1.default.category, data.categoryId);
        if (data.unitId)
            await this.findByIdOrThrow(prisma_js_1.default.unit, data.unitId);
        return prisma_js_1.default.product.create({
            data,
            include: { category: true, unit: true },
        });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.product, id);
        if (data.code) {
            const existing = await prisma_js_1.default.product.findUnique({ where: { code: data.code } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        if (data.sku) {
            const existing = await prisma_js_1.default.product.findUnique({ where: { sku: data.sku } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('SKU already exists', 409);
        }
        if (data.barcode) {
            const existing = await prisma_js_1.default.product.findUnique({ where: { barcode: data.barcode } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Barcode already exists', 409);
        }
        if (data.categoryId)
            await this.findByIdOrThrow(prisma_js_1.default.category, data.categoryId);
        if (data.unitId)
            await this.findByIdOrThrow(prisma_js_1.default.unit, data.unitId);
        return prisma_js_1.default.product.update({
            where: { id },
            data,
            include: { category: true, unit: true },
        });
    }
    async delete(id) {
        const count = await prisma_js_1.default.stockLevel.count({ where: { productId: id } });
        if (count > 0)
            throw new errorHandler_js_1.AppError('Cannot delete product with stock levels', 400);
        await prisma_js_1.default.product.delete({ where: { id } });
    }
}
exports.ProductService = ProductService;
exports.productService = new ProductService();
//# sourceMappingURL=product.service.js.map