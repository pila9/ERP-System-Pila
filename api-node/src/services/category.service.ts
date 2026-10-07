import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { categoryQuerySchema } from '../validators/category.validators';

export class CategoryService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, parentId, isActive, includeChildren, sortBy, sortOrder } = categoryQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (parentId !== undefined) where.parentId = parentId || null;
    if (isActive !== undefined) where.isActive = isActive;

    const include = includeChildren ? { children: true, parent: true, _count: { select: { products: true } } } : { _count: { select: { products: true } } };

    const [categories, total] = await Promise.all([
      prisma.category.findMany({ where, include, orderBy: { [sortBy]: sortOrder }, skip, take }),
      prisma.category.count({ where }),
    ]);

    return createPaginatedResult(categories, total, page, limit);
  }

  async getTree() {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: { children: { where: { isActive: true }, include: { children: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.category, id, { parent: true, children: true, _count: { select: { products: true } } });
  }

  async create(data: any) {
    if (data.code) {
      const existing = await prisma.category.findUnique({ where: { code: data.code } });
      if (existing) throw new AppError('Code already exists', 409);
    }
    if (data.parentId) {
      await this.findByIdOrThrow(prisma.category, data.parentId);
    }
    return prisma.category.create({ data, include: { parent: true } });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.category, id);

    if (data.code) {
      const existing = await prisma.category.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new AppError('Code already exists', 409);
    }
    if (data.parentId) {
      if (data.parentId === id) throw new AppError('Cannot set self as parent', 400);
      await this.findByIdOrThrow(prisma.category, data.parentId);
    }

    return prisma.category.update({ where: { id }, data, include: { parent: true } });
  }

  async delete(id: string) {
    const category = await this.findByIdOrThrow(prisma.category, id);
    const childrenCount = await prisma.category.count({ where: { parentId: id } });
    const productsCount = await prisma.product.count({ where: { categoryId: id } });

    if (childrenCount > 0) throw new AppError('Cannot delete category with subcategories', 400);
    if (productsCount > 0) throw new AppError('Cannot delete category with products', 400);

    await prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();