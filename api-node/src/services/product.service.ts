import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { productQuerySchema } from '../validators/product.validators';

export class ProductService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, categoryId, unitId, isActive, lowStock, sortBy, sortOrder } = productQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (unitId) where.unitId = unitId;
    if (isActive !== undefined) where.isActive = isActive;
    if (lowStock) {
      where.trackInventory = true;
      where.stockLevels = { some: { quantity: { lte: prisma.product.fields.reorderLevel } } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      prisma.product.count({ where }),
    ]);

    return createPaginatedResult(products, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.product, id, {
      category: true,
      unit: true,
      stockLevels: { include: { warehouse: true } },
    });
  }

  async create(data: any) {
    const existing = await prisma.product.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Code already exists', 409);

    if (data.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } } as any);
      if (skuExists) throw new AppError('SKU already exists', 409);
    }

    if (data.barcode) {
      const barcodeExists = await prisma.product.findUnique({ where: { barcode: data.barcode } } as any);
      if (barcodeExists) throw new AppError('Barcode already exists', 409);
    }

    if (data.categoryId) await this.findByIdOrThrow(prisma.category, data.categoryId);
    if (data.unitId) await this.findByIdOrThrow(prisma.unit, data.unitId);

    return prisma.product.create({
      data,
      include: { category: true, unit: true },
    });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.product, id);

    if (data.code) {
      const existing = await prisma.product.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new AppError('Code already exists', 409);
    }
    if (data.sku) {
      const existing = await prisma.product.findUnique({ where: { sku: data.sku } } as any);
      if (existing && existing.id !== id) throw new AppError('SKU already exists', 409);
    }
    if (data.barcode) {
      const existing = await prisma.product.findUnique({ where: { barcode: data.barcode } } as any);
      if (existing && existing.id !== id) throw new AppError('Barcode already exists', 409);
    }
    if (data.categoryId) await this.findByIdOrThrow(prisma.category, data.categoryId);
    if (data.unitId) await this.findByIdOrThrow(prisma.unit, data.unitId);

    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, unit: true },
    });
  }

  async delete(id: string) {
    const count = await prisma.stockLevel.count({ where: { productId: id } });
    if (count > 0) throw new AppError('Cannot delete product with stock levels', 400);
    await prisma.product.delete({ where: { id } });
  }
}

export const productService = new ProductService();