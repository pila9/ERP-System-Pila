import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { roleQuerySchema } from '../validators/role.validators';

export class RoleService extends BaseService {
  async getAll(query: any) {
    const { page, limit, search, isSystem, sortBy, sortOrder } = roleQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isSystem !== undefined) where.isSystem = isSystem;

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: { _count: { select: { users: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.role.count({ where }),
    ]);

    return createPaginatedResult(roles, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.role, id, { users: { select: { id: true, name: true, email: true } } });
  }

  async create(data: any) {
    const existing = await prisma.role.findUnique({ where: { slug: data.slug } });
    if (existing) throw new AppError('Role slug already exists', 409);

    return prisma.role.create({ data });
  }

  async update(id: string, data: any) {
    await this.findByIdOrThrow(prisma.role, id);

    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) throw new AppError('Cannot modify system roles', 403);

    return prisma.role.update({ where: { id }, data });
  }

  async delete(id: string) {
    const role: any = await this.findByIdOrThrow(prisma.role, id);
    if (role.isSystem) throw new AppError('Cannot delete system roles', 403);

    const userCount = await prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) throw new AppError('Cannot delete role with assigned users', 400);

    await prisma.role.delete({ where: { id } });
  }
}

export const roleService = new RoleService();