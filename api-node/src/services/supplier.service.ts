import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { supplierQuerySchema } from '../validators/supplier.validators';

export class SupplierService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, isActive, sortBy, sortOrder } = supplierQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchaseOrders: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.supplier.count({ where }),
    ]);

    return createPaginatedResult(suppliers, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.supplier, id, { _count: { select: { purchaseOrders: true } } });
  }

  async create(data: any) {
    const existing = await prisma.supplier.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Code already exists', 409);
    return prisma.supplier.create({ data });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.supplier, id);

    if (data.code) {
      const existing = await prisma.supplier.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new AppError('Code already exists', 409);
    }
    return prisma.supplier.update({ where: { id }, data });
  }

  async delete(id: string) {
    const count = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (count > 0) throw new AppError('Cannot delete supplier with purchase orders', 400);
    await prisma.supplier.delete({ where: { id } });
  }
}

export const supplierService = new SupplierService();