import prisma from '../utils/prisma.js';
import { toNumber } from './base.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { purchaseOrderQuerySchema } from '../validators/purchaseOrder.validators';

export class PurchaseOrderService extends BaseService {
  async getAll(query: any, userId?: string) {
    const { page, limit, search, supplierId, status, dateFrom, dateTo, sortBy, sortOrder } = purchaseOrderQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          user: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, code: true, name: true, unit: { select: { abbreviation: true } } } } },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return createPaginatedResult(orders, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.purchaseOrder, id, {
      supplier: true,
      user: { select: { id: true, name: true, email: true } },
      warehouse: true,
      items: { include: { product: { include: { unit: true } } } },
    });
  }

  async generateNumber() {
    const date = new Date();
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const seq = await prisma.documentSequence.upsert({
      where: { sequenceKey_period: { sequenceKey: 'PO', period } },
      update: { number: { increment: 1 } },
      create: { sequenceKey: 'PO', period, number: 1 },
    });
    return `PO-${period}-${String(seq.number).padStart(6, '0')}`;
  }

  async create(data: any, userId: string) {
    await prisma.supplier.findUniqueOrThrow({ where: { id: data.supplierId } });
    if (data.warehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });

    for (const item of data.items) {
      await prisma.product.findUniqueOrThrow({ where: { id: item.productId } });
    }

    const number = await this.generateNumber();

    const subtotal = data.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice - item.discount, 0);
    const taxTotal = data.items.reduce((sum: number, item: any) => {
      const taxable = item.quantity * item.unitPrice - item.discount;
      return sum + taxable * item.taxRate / 100;
    }, 0);

    let discountAmount = 0;
    if (data.discountType === 'percentage') {
      discountAmount = subtotal * data.discountValue / 100;
    } else {
      discountAmount = data.discountValue;
    }

    const grandTotal = subtotal + taxTotal + data.shipping - discountAmount;

    return prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          number,
          supplierId: data.supplierId,
          userId,
          warehouseId: data.warehouseId,
          orderDate: new Date(data.orderDate),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          status: data.status,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount,
          subtotal,
          taxTotal,
          shipping: data.shipping,
          grandTotal,
          notes: data.notes,
          terms: data.terms,
          reference: data.reference,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost || 0,
              discount: item.discount,
              taxRate: item.taxRate,
              subtotal: item.quantity * item.unitPrice - item.discount,
              taxAmount: (item.quantity * item.unitPrice - item.discount) * item.taxRate / 100,
              total: (item.quantity * item.unitPrice - item.discount) * (1 + item.taxRate / 100),
              description: item.description,
            })),
          },
        },
        include: {
          supplier: true,
          user: { select: { id: true, name: true } },
          warehouse: true,
          items: { include: { product: { include: { unit: true } } } },
        },
      });
      return order;
    });
  }

  async update(id: string, data: any) {
    const order: any = await this.findByIdOrThrow(prisma.purchaseOrder, id, { items: true });

    if (data.supplierId) await prisma.supplier.findUniqueOrThrow({ where: { id: data.supplierId } });
    if (data.warehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });

    if (data.items) {
      for (const item of data.items) {
        await prisma.product.findUniqueOrThrow({ where: { id: item.productId } });
      }
    }

    let subtotal = order.subtotal;
    let taxTotal = order.taxTotal;
    let discountAmount = order.discountAmount;
    let grandTotal = order.grandTotal;

    if (data.items || data.discountType || data.discountValue || data.shipping !== undefined) {
      const items = data.items || order.items;
      const discountType = data.discountType || order.discountType;
      const discountValue = data.discountValue !== undefined ? data.discountValue : order.discountValue;
      const shipping = data.shipping !== undefined ? data.shipping : order.shipping;

      subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice - item.discount, 0);
      taxTotal = items.reduce((sum: number, item: any) => {
        const taxable = item.quantity * item.unitPrice - item.discount;
        return sum + taxable * item.taxRate / 100;
      }, 0);

      if (discountType === 'percentage') {
        discountAmount = subtotal * discountValue / 100;
      } else {
        discountAmount = discountValue;
      }
      grandTotal = subtotal + taxTotal + shipping - discountAmount;
    }

    return prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
        await tx.purchaseOrderItem.createMany({
          data: data.items.map((item: any) => ({
            purchaseOrderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost || 0,
            discount: item.discount,
            taxRate: item.taxRate,
            subtotal: item.quantity * item.unitPrice - item.discount,
            taxAmount: (item.quantity * item.unitPrice - item.discount) * item.taxRate / 100,
            total: (item.quantity * item.unitPrice - item.discount) * (1 + item.taxRate / 100),
            description: item.description,
          })),
        });
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...data,
          orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
          subtotal,
          taxTotal,
          discountAmount,
          grandTotal,
        },
        include: {
          supplier: true,
          user: { select: { id: true, name: true } },
          warehouse: true,
          items: { include: { product: { include: { unit: true } } } },
        },
      });
    });
  }

  async updateStatus(id: string, status: string) {
    const order: any = await this.findByIdOrThrow(prisma.purchaseOrder, id);
    const updateData: any = { status };

    if (status === 'ordered' && order.status === 'draft') updateData.orderedAt = new Date();
    if (status === 'received' && order.status === 'ordered') updateData.receivedAt = new Date();
    if (status === 'cancelled') updateData.cancelledAt = new Date();

    return prisma.purchaseOrder.update({ where: { id }, data: updateData });
  }

  async receive(id: string, items: { itemId: string; receivedQty: number }[]) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { items: true } });

      for (const { itemId, receivedQty } of items) {
        const item = order.items.find(i => i.id === itemId);
        if (!item) throw new AppError(`Item ${itemId} not found`, 404);
        if (toNumber(item.receivedQty) + toNumber(receivedQty) > toNumber(item.quantity)) {
          throw new AppError(`Received quantity exceeds ordered quantity for item ${itemId}`, 400);
        }

        await tx.purchaseOrderItem.update({
          where: { id: itemId },
          data: { receivedQty: { increment: receivedQty } },
        });

        if (order.warehouseId) {
          await tx.stockLevel.upsert({
            where: { productId_warehouseId: { productId: item.productId, warehouseId: order.warehouseId } },
            update: { quantity: { increment: receivedQty } },
            create: { productId: item.productId, warehouseId: order.warehouseId, quantity: receivedQty },
          });

          await tx.stockMovement.create({
            data: {
              number: `RCV-${order.number}-${itemId.slice(-6)}`,
              productId: item.productId,
              warehouseId: order.warehouseId,
              type: 'in',
              quantity: receivedQty,
              unitCost: item.unitCost,
              referenceId: order.id,
              referenceType: 'PurchaseOrder',
              note: `Received from PO ${order.number}`,
            },
          });
        }
      }

      const allReceived = order.items.every(i => toNumber(i.receivedQty) + toNumber(items.find(r => r.itemId === i.id)?.receivedQty || 0) >= toNumber(i.quantity));
      if (allReceived) {
        await tx.purchaseOrder.update({ where: { id }, data: { status: 'received', receivedAt: new Date() } });
      }

      return tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
    });
  }

  async delete(id: string) {
    await this.findByIdOrThrow(prisma.purchaseOrder, id);
    await prisma.purchaseOrder.delete({ where: { id } });
  }
}

export const purchaseOrderService = new PurchaseOrderService();