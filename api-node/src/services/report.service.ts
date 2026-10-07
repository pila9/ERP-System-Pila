import prisma from '../utils/prisma.js';
import { reportQuerySchema } from '../validators/report.validators';
import { toNumber } from './base.service.js';

export class ReportService {
  async getSalesReport(query: any) {
    const { dateFrom, dateTo, warehouseId, categoryId } = reportQuerySchema.parse(query);

    const where: any = {
      status: { in: ['confirmed', 'shipped', 'completed'] },
    };
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }
    if (warehouseId) where.warehouseId = warehouseId;

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    });

    const byProduct: Record<string, { name: string; code: string; quantity: number; revenue: number }> = {};
    const byCategory: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const order of orders) {
      for (const item of order.items) {
        const pKey = item.productId;
        if (!byProduct[pKey]) {
          byProduct[pKey] = { name: item.product.name, code: item.product.code, quantity: 0, revenue: 0 };
        }
        byProduct[pKey].quantity += toNumber(item.quantity);
        byProduct[pKey].revenue += toNumber(item.total);

        const cKey = item.product.categoryId || 'uncategorized';
        const cName = item.product.category?.name || 'Uncategorized';
        if (!byCategory[cKey]) {
          byCategory[cKey] = { name: cName, quantity: 0, revenue: 0 };
        }
        byCategory[cKey].quantity += toNumber(item.quantity);
        byCategory[cKey].revenue += toNumber(item.total);
      }
    }

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + toNumber(o.grandTotal), 0),
      byProduct: Object.values(byProduct).sort((a, b) => b.revenue - a.revenue),
      byCategory: Object.values(byCategory).sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getPurchaseReport(query: any) {
    const { dateFrom, dateTo, warehouseId } = reportQuerySchema.parse(query);

    const where: any = { status: { in: ['ordered', 'received'] } };
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }
    if (warehouseId) where.warehouseId = warehouseId;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true, items: { include: { product: { include: { category: true } } } } },
    });

    const byProduct: Record<string, { name: string; code: string; quantity: number; cost: number }> = {};
    const bySupplier: Record<string, { name: string; orders: number; total: number }> = {};

    for (const order of orders) {
      for (const item of order.items) {
        const pKey = item.productId;
        if (!byProduct[pKey]) {
          byProduct[pKey] = { name: item.product.name, code: item.product.code, quantity: 0, cost: 0 };
        }
        byProduct[pKey].quantity += toNumber(item.quantity);
        byProduct[pKey].cost += toNumber(item.total);
      }

      const sKey = order.supplierId;
      if (!bySupplier[sKey]) {
        bySupplier[sKey] = { name: order.supplier.name, orders: 0, total: 0 };
      }
      bySupplier[sKey].orders += 1;
      bySupplier[sKey].total += toNumber(order.grandTotal);
    }

    return {
      totalOrders: orders.length,
      totalCost: orders.reduce((sum, o) => sum + toNumber(o.grandTotal), 0),
      byProduct: Object.values(byProduct).sort((a, b) => b.cost - a.cost),
      bySupplier: Object.values(bySupplier).sort((a, b) => b.total - a.total),
    };
  }

  async getInventoryReport(query: any) {
    const { warehouseId, categoryId } = reportQuerySchema.parse(query);

    const where: any = { product: { trackInventory: true, isActive: true } };
    if (warehouseId) where.warehouseId = warehouseId;
    if (categoryId) where.product.categoryId = categoryId;

    const levels = await prisma.stockLevel.findMany({
      where,
      include: { product: { include: { unit: true, category: true } }, warehouse: true },
    });

    const byWarehouse: Record<string, { name: string; items: number; value: number }> = {};
    const byCategory: Record<string, { name: string; items: number; value: number }> = {};

    for (const level of levels) {
      const wKey = level.warehouseId;
      if (!byWarehouse[wKey]) {
        byWarehouse[wKey] = { name: level.warehouse.name, items: 0, value: 0 };
      }
      byWarehouse[wKey].items += 1;
      byWarehouse[wKey].value += toNumber(level.quantity) * toNumber(level.product.costPrice);

      const cKey = level.product.categoryId || 'uncategorized';
      const cName = level.product.category?.name || 'Uncategorized';
      if (!byCategory[cKey]) {
        byCategory[cKey] = { name: cName, items: 0, value: 0 };
      }
      byCategory[cKey].items += 1;
      byCategory[cKey].value += toNumber(level.quantity) * toNumber(level.product.costPrice);
    }

    return {
      totalItems: levels.length,
      totalValue: levels.reduce((sum, l) => sum + toNumber(l.quantity) * toNumber(l.product.costPrice), 0),
      byWarehouse: Object.values(byWarehouse),
      byCategory: Object.values(byCategory),
    };
  }

  async getReceivablesReport(query: any) {
    const { dateFrom, dateTo } = reportQuerySchema.parse(query);

    const where: any = { status: { in: ['sent', 'partial'] } };
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate.gte = new Date(dateFrom);
      if (dateTo) where.invoiceDate.lte = new Date(dateTo);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true, payments: true },
    });

    const byCustomer: Record<string, { name: string; invoices: number; total: number; paid: number; outstanding: number }> = {};

    for (const inv of invoices) {
      const paid = inv.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
      const outstanding = toNumber(inv.grandTotal) - paid;

      if (!byCustomer[inv.customerId]) {
        byCustomer[inv.customerId] = { name: inv.customer.name, invoices: 0, total: 0, paid: 0, outstanding: 0 };
      }
      byCustomer[inv.customerId].invoices += 1;
      byCustomer[inv.customerId].total += toNumber(inv.grandTotal);
      byCustomer[inv.customerId].paid += paid;
      byCustomer[inv.customerId].outstanding += outstanding;
    }

    return {
      totalOutstanding: invoices.reduce((sum, i) => sum + (toNumber(i.grandTotal) - i.payments.reduce((s, p) => s + toNumber(p.amount), 0)), 0),
      byCustomer: Object.values(byCustomer).sort((a, b) => b.outstanding - a.outstanding),
    };
  }

  async getPayablesReport(query: any) {
    const { dateFrom, dateTo } = reportQuerySchema.parse(query);

    const where: any = { status: { in: ['ordered', 'received'] } };
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true },
    });

    const bySupplier: Record<string, { name: string; orders: number; total: number; paid: number; outstanding: number }> = {};

    for (const order of orders) {
      const total = toNumber(order.grandTotal);
      if (!bySupplier[order.supplierId]) {
        bySupplier[order.supplierId] = { name: order.supplier.name, orders: 0, total: 0, paid: 0, outstanding: 0 };
      }
      bySupplier[order.supplierId].orders += 1;
      bySupplier[order.supplierId].total += total;
      bySupplier[order.supplierId].outstanding += total;
    }

    return {
      totalOutstanding: orders.reduce((sum, o) => sum + toNumber(o.grandTotal), 0),
      bySupplier: Object.values(bySupplier).sort((a, b) => b.outstanding - a.outstanding),
    };
  }
}

export const reportService = new ReportService();