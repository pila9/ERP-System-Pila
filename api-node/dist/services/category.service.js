"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = exports.CategoryService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const category_validators_1 = require("../validators/category.validators");
class CategoryService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, parentId, isActive, includeChildren, sortBy, sortOrder } = category_validators_1.categoryQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (parentId !== undefined)
            where.parentId = parentId || null;
        if (isActive !== undefined)
            where.isActive = isActive;
        const include = includeChildren ? { children: true, parent: true, _count: { select: { products: true } } } : { _count: { select: { products: true } } };
        const [categories, total] = await Promise.all([
            prisma_js_1.default.category.findMany({ where, include, orderBy: { [sortBy]: sortOrder }, skip, take }),
            prisma_js_1.default.category.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(categories, total, page, limit);
    }
    async getTree() {
        const categories = await prisma_js_1.default.category.findMany({
            where: { parentId: null, isActive: true },
            include: { children: { where: { isActive: true }, include: { children: { where: { isActive: true } } } } },
            orderBy: { name: 'asc' },
        });
        return categories;
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.category, id, { parent: true, children: true, _count: { select: { products: true } } });
    }
    async create(data) {
        if (data.code) {
            const existing = await prisma_js_1.default.category.findUnique({ where: { code: data.code } });
            if (existing)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        if (data.parentId) {
            await this.findByIdOrThrow(prisma_js_1.default.category, data.parentId);
        }
        return prisma_js_1.default.category.create({ data, include: { parent: true } });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.category, id);
        if (data.code) {
            const existing = await prisma_js_1.default.category.findUnique({ where: { code: data.code } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        if (data.parentId) {
            if (data.parentId === id)
                throw new errorHandler_js_1.AppError('Cannot set self as parent', 400);
            await this.findByIdOrThrow(prisma_js_1.default.category, data.parentId);
        }
        return prisma_js_1.default.category.update({ where: { id }, data, include: { parent: true } });
    }
    async delete(id) {
        const category = await this.findByIdOrThrow(prisma_js_1.default.category, id);
        const childrenCount = await prisma_js_1.default.category.count({ where: { parentId: id } });
        const productsCount = await prisma_js_1.default.product.count({ where: { categoryId: id } });
        if (childrenCount > 0)
            throw new errorHandler_js_1.AppError('Cannot delete category with subcategories', 400);
        if (productsCount > 0)
            throw new errorHandler_js_1.AppError('Cannot delete category with products', 400);
        await prisma_js_1.default.category.delete({ where: { id } });
    }
}
exports.CategoryService = CategoryService;
exports.categoryService = new CategoryService();
//# sourceMappingURL=category.service.js.map