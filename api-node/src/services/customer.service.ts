import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { customerQuerySchema } from '../validators/customer.validators';

export class CustomerService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, isActive, sortBy, sortOrder } = customerQuerySchema.parse(query);
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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { salesOrders: true, invoices: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ]);

    return createPaginatedResult(customers, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.customer, id, {
      _count: { select: { salesOrders: true, invoices: true } },
    });
  }

  async create(data: any) {
    const existing = await prisma.customer.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Code already exists', 409);
    return prisma.customer.create({ data });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.customer, id);

    if (data.code) {
      const existing = await prisma.customer.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new AppError('Code already exists', 409);
    }
    return prisma.customer.update({ where: { id }, data });
  }

  async delete(id: string) {
    const count = await prisma.salesOrder.count({ where: { customerId: id } });
    if (count > 0) throw new AppError('Cannot delete customer with sales orders', 400);
    await prisma.customer.delete({ where: { id } });
  }
}

export const customerService = new CustomerService();