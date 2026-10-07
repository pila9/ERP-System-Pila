import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { unitQuerySchema } from '../validators/unit.validators';

export class UnitService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, isActive, sortBy, sortOrder } = unitQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { abbreviation: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.unit.count({ where }),
    ]);

    return createPaginatedResult(units, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.unit, id, { _count: { select: { products: true } } });
  }

  async create(data: any) {
    const existing = await prisma.unit.findUnique({ where: { abbreviation: data.abbreviation } } as any);
    if (existing) throw new AppError('Abbreviation already exists', 409);
    return prisma.unit.create({ data });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.unit, id);

    if (data.abbreviation) {
      const existing = await prisma.unit.findUnique({ where: { abbreviation: data.abbreviation } } as any);
      if (existing && existing.id !== id) throw new AppError('Abbreviation already exists', 409);
    }
    return prisma.unit.update({ where: { id }, data });
  }

  async delete(id: string) {
    const count = await prisma.product.count({ where: { unitId: id } });
    if (count > 0) throw new AppError('Cannot delete unit with products', 400);
    await prisma.unit.delete({ where: { id } });
  }
}

export const unitService = new UnitService();