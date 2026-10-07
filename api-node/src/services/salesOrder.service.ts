import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { BaseService, getPaginationParams, createPaginatedResult } from './base.service.js';
import { salesOrderQuerySchema } from '../validators/salesOrder.validators';

export class SalesOrderService extends BaseService {
  async getAll(query: any, userId?: string) {
    const { page, limit, search, customerId, status, dateFrom, dateTo, sortBy, sortOrder } = salesOrderQuerySchema.parse(query);
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, code: true, name: true } },
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
      prisma.salesOrder.count({ where }),
    ]);

    return createPaginatedResult(orders, total, page, limit);
  }

  async getById(id: string) {
    return this.findByIdOrThrow(prisma.salesOrder, id, {
      customer: true,
      user: { select: { id: true, name: true, email: true } },
      warehouse: true,
      items: { include: { product: { include: { unit: true } }, warehouse: true } },
    });
  }

  async generateNumber() {
    const date = new Date();
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const seq = await prisma.documentSequence.upsert({
      where: { sequenceKey_period: { sequenceKey: 'SO', period } },
      update: { number: { increment: 1 } },
      create: { sequenceKey: 'SO', period, number: 1 },
    });
    return `SO-${period}-${String(seq.number).padStart(6, '0')}`;
  }

  async create(data: any, userId: string) {
    await prisma.customer.findUniqueOrThrow({ where: { id: data.customerId } });
    if (data.warehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });

    for (const item of data.items) {
      await prisma.product.findUniqueOrThrow({ where: { id: item.productId } });
      if (item.warehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: item.warehouseId } });
    }

    const number = await this.generateNumber();

    const subtotal = data.items.reduce((sum: number, item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice - item.discount;
      return sum + itemSubtotal;
    }, 0);

    const taxTotal = data.items.reduce((sum: number, item: any) => {
      const taxable = item.quantity * item.unitPrice - item.discount;
      return sum + (taxable * item.taxRate / 100);
    }, 0);

    let discountAmount = 0;
    if (data.discountType === 'percentage') {
      discountAmount = subtotal * data.discountValue / 100;
    } else {
      discountAmount = data.discountValue;
    }

    const grandTotal = subtotal + taxTotal + data.shipping - discountAmount;

    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.create({
        data: {
          number,
          customerId: data.customerId,
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
              warehouseId: item.warehouseId,
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
          customer: true,
          user: { select: { id: true, name: true } },
          warehouse: true,
          items: { include: { product: { include: { unit: true } }, warehouse: true } },
        },
      });
      return order;
    });
  }

  async update(id: string, data: any) {
    const order: any = await this.findByIdOrThrow(prisma.salesOrder, id, { items: true });

    if (data.customerId) await prisma.customer.findUniqueOrThrow({ where: { id: data.customerId } });
    if (data.warehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });

    if (data.items) {
      for (const item of data.items) {
        await prisma.product.findUniqueOrThrow({ where: { id: item.productId } });
        if (item.warehouseId) await prisma.warehouse.findUniqueOrThrow({ where: { id: item.warehouseId } });
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
        await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
        await tx.salesOrderItem.createMany({
          data: data.items.map((item: any) => ({
            salesOrderId: id,
            productId: item.productId,
            warehouseId: item.warehouseId,
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

      return tx.salesOrder.update({
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
          customer: true,
          user: { select: { id: true, name: true } },
          warehouse: true,
          items: { include: { product: { include: { unit: true } }, warehouse: true } },
        },
      });
    });
  }

  async updateStatus(id: string, status: string) {
    const order: any = await this.findByIdOrThrow(prisma.salesOrder, id);
    const updateData: any = { status };

    if (status === 'confirmed' && order.status === 'draft') updateData.confirmedAt = new Date();
    if (status === 'shipped' && order.status === 'confirmed') updateData.shippedAt = new Date();
    if (status === 'completed' && order.status === 'shipped') updateData.completedAt = new Date();
    if (status === 'cancelled') updateData.cancelledAt = new Date();

    return prisma.salesOrder.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.findByIdOrThrow(prisma.salesOrder, id);
    await prisma.salesOrder.delete({ where: { id } });
  }
}

export const salesOrderService = new SalesOrderService();