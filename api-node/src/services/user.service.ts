import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { userQuerySchema } from '../validators/user.validators';

export class UserService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, roleId, isActive, sortBy, sortOrder } = userQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleId) where.roleId = roleId;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: { select: { id: true, name: true, slug: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.user, id, { role: true });
  }

  async create(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already exists', 409);

    if (data.code) {
      const codeExists = await prisma.user.findUnique({ where: { code: data.code } });
      if (codeExists) throw new AppError('Code already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: { ...data, password: hashedPassword },
      include: { role: { select: { id: true, name: true, slug: true } } },
    });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.user, id);

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) throw new AppError('Email already exists', 409);
    }

    if (data.code) {
      const existing = await prisma.user.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new AppError('Code already exists', 409);
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data,
      include: { role: { select: { id: true, name: true, slug: true } } },
    });
  }

  async delete(id: string) {
    await this.findByIdOrThrow(prisma.user, id);
    await prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();