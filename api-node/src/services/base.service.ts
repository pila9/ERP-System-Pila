import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Decimal) return Number(value);
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function getPaginationParams(page: number, limit: number): PaginationParams {
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

export function createPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export class BaseService {
  protected prisma = prisma;

  async findById(model: any, id: string, include?: any): Promise<any> {
    return model.findUnique({ where: { id }, include });
  }

  async findByIdOrThrow(model: any, id: string, include?: any): Promise<any> {
    const record = await this.findById(model, id, include);
    if (!record) throw new AppError('Record not found', 404);
    return record;
  }

  async softDelete(model: any, id: string): Promise<void> {
    await this.findByIdOrThrow(model, id);
    await model.update({ where: { id }, data: { isActive: false } });
  }
}