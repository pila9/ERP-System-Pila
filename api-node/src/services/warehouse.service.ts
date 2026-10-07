import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { warehouseQuerySchema } from '../validators/warehouse.validators';

export class WarehouseService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, isActive, isDefault, sortBy, sortOrder } = warehouseQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (isDefault !== undefined) where.isDefault = isDefault;

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: { _count: { select: { stockLevels: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.warehouse.count({ where }),
    ]);

    return createPaginatedResult(warehouses, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.warehouse, id, { _count: { select: { stockLevels: true } } });
  }

  async create(data: any) {
    const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Code already exists', 409);

    if (data.isDefault) {
      await prisma.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    return prisma.warehouse.create({ data });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.warehouse, id);

    if (data.code) {
      const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new AppError('Code already exists', 409);
    }

    if (data.isDefault) {
      await prisma.warehouse.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
    }

    return prisma.warehouse.update({ where: { id }, data });
  }

  async delete(id: string) {
    const count = await prisma.stockLevel.count({ where: { warehouseId: id } });
    if (count > 0) throw new AppError('Cannot delete warehouse with stock levels', 400);
    await prisma.warehouse.delete({ where: { id } });
  }
}

export const warehouseService = new WarehouseService();