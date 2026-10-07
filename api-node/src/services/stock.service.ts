import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult, toNumber } from './base.service.js';
import { stockLevelQuerySchema, stockMovementQuerySchema, stockMovementSchema } from '../validators/stock.validators';

export class StockService extends BaseService {
  async getLevels(query: any) {
    const { page, limit, productId, warehouseId, lowStock } = stockLevelQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    // lowStock is applied as a client-side filter (reorderLevel lives on Product)

    const [levels, total] = await Promise.all([
      prisma.stockLevel.findMany({
        where,
        include: {
          product: { include: { unit: true } },
          warehouse: true,
        },
        orderBy: { product: { name: 'asc' } },
        skip,
        take,
      }),
      prisma.stockLevel.count({ where }),
    ]);

    return createPaginatedResult(levels, total, page, limit);
  }

  async getMovements(query: any) {
    const { page, limit, productId, warehouseId, type, dateFrom, dateTo, sortBy, sortOrder } = stockMovementQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { include: { unit: true } },
          warehouse: true,
          toWarehouse: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return createPaginatedResult(movements, total, page, limit);
  }

  async createMovement(data: any, userId: string) {
    const { productId, warehouseId, toWarehouseId, type, quantity, unitCost, referenceId, referenceType, note } = stockMovementSchema.parse(data);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const warehouse = await prisma.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });
    if (toWarehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: toWarehouseId } });

    return prisma.$transaction(async (tx) => {
      let balanceAfter = 0;

      if (type === 'in' || type === 'return') {
        const level = await tx.stockLevel.upsert({
          where: { productId_warehouseId: { productId, warehouseId } },
          update: { quantity: { increment: quantity } },
          create: { productId, warehouseId, quantity },
        });
        balanceAfter = toNumber(level.quantity);
      } else if (type === 'out') {
        const level = await tx.stockLevel.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } }) as any;
        if (!level || toNumber(level.quantity) < toNumber(quantity)) {
          throw new AppError('Insufficient stock', 400);
        }
        const updated = await tx.stockLevel.update({
          where: { productId_warehouseId: { productId, warehouseId } },
          data: { quantity: { decrement: quantity } },
        });
        balanceAfter = toNumber(updated.quantity);
      } else if (type === 'transfer') {
        if (!toWarehouseId) throw new AppError('Destination warehouse required for transfer', 400);
        if (toWarehouseId === warehouseId) throw new AppError('Cannot transfer to same warehouse', 400);

        const fromLevel = await tx.stockLevel.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } }) as any;
        if (!fromLevel || toNumber(fromLevel.quantity) < toNumber(quantity)) {
          throw new AppError('Insufficient stock in source warehouse', 400);
        }

        await tx.stockLevel.update({
          where: { productId_warehouseId: { productId, warehouseId } },
          data: { quantity: { decrement: quantity } },
        });

        const toLevel = await tx.stockLevel.upsert({
          where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
          update: { quantity: { increment: quantity } },
          create: { productId, warehouseId: toWarehouseId, quantity },
        });
        balanceAfter = toNumber(toLevel.quantity);
      } else if (type === 'adjustment') {
        const level = await tx.stockLevel.upsert({
          where: { productId_warehouseId: { productId, warehouseId } },
          update: { quantity: quantity },
          create: { productId, warehouseId, quantity },
        });
        balanceAfter = toNumber(level.quantity);
      }

      const date = new Date();
      const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const seq = await tx.documentSequence.upsert({
        where: { sequenceKey_period: { sequenceKey: 'STK', period } },
        update: { number: { increment: 1 } },
        create: { sequenceKey: 'STK', period, number: 1 },
      });
      const number = `STK-${period}-${String(seq.number).padStart(6, '0')}`;

      return tx.stockMovement.create({
        data: {
          number,
          productId,
          warehouseId,
          toWarehouseId,
          type,
          quantity,
          unitCost,
          balanceAfter,
          referenceId,
          referenceType,
          note,
          userId,
        },
        include: {
          product: { include: { unit: true } },
          warehouse: true,
          toWarehouse: true,
          user: { select: { id: true, name: true } },
        },
      });
    });
  }

  async getLowStock(warehouseId?: string) {
    const where: any = {
      product: { trackInventory: true, isActive: true },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const levels = await prisma.stockLevel.findMany({
      where,
      include: { product: { include: { unit: true } }, warehouse: true },
    });

    return levels.filter(l => toNumber(l.quantity) <= toNumber(l.product.reorderLevel));
  }

  async getStockValuation(warehouseId?: string) {
    const where: any = { product: { trackInventory: true } };
    if (warehouseId) where.warehouseId = warehouseId;

    const levels = await prisma.stockLevel.findMany({
      where,
      include: { product: true },
    });

    return levels.map(l => ({
      product: l.product,
      quantity: toNumber(l.quantity),
      unitCost: toNumber(l.product.costPrice),
      totalValue: toNumber(l.quantity) * toNumber(l.product.costPrice),
    }));
  }
}

export const stockService = new StockService();