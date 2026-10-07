import prisma from '../utils/prisma.js';
import { dashboardQuerySchema } from '../validators/report.validators';
import { toNumber } from './base.service.js';

export class DashboardService {
  async getOverview(query: any) {
    const { dateFrom, dateTo } = dashboardQuerySchema.parse(query);

    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
    }

    const [salesOrders, purchaseOrders, invoices, products, customers, suppliers] = await Promise.all([
      prisma.salesOrder.count({
        where: { orderDate: dateFilter, status: { in: ['confirmed', 'shipped', 'completed'] } },
      }),
      prisma.purchaseOrder.count({ where: { orderDate: dateFilter } }),
      prisma.invoice.count({ where: { invoiceDate: dateFilter } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
    ]);

    const [salesRevenue, purchaseCost, outstandingReceivables, outstandingPayables] = await Promise.all([
      prisma.salesOrder.aggregate({
        where: { orderDate: dateFilter, status: { in: ['confirmed', 'shipped', 'completed'] } },
        _sum: { grandTotal: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { orderDate: dateFilter, status: { in: ['ordered', 'received'] } },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['sent', 'partial'] } },
        _sum: { grandTotal: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { status: { in: ['ordered', 'received'] } },
        _sum: { grandTotal: true },
      }),
    ]);

    // low stock is computed client-side (reorderLevel lives on Product)
    const lowLevels = await prisma.stockLevel.findMany({
      where: { product: { trackInventory: true, isActive: true } },
      include: { product: true },
    });
    const lowStockCount = lowLevels.filter(l => toNumber(l.quantity) <= toNumber(l.product.reorderLevel)).length;

    const recentSalesOrders = await prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } }, items: { take: 1, include: { product: { select: { name: true } } } } },
    });

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    });

    return {
      stats: {
        salesOrders,
        purchaseOrders,
        invoices,
        products,
        customers,
        suppliers,
        salesRevenue: toNumber(salesRevenue._sum.grandTotal),
        purchaseCost: toNumber(purchaseCost._sum.grandTotal),
        outstandingReceivables: toNumber(outstandingReceivables._sum.grandTotal),
        outstandingPayables: toNumber(outstandingPayables._sum.grandTotal),
        lowStockCount,
      },
      recentSalesOrders,
      recentInvoices,
    };
  }

  async getSalesChart(query: any) {
    const { dateFrom, dateTo } = dashboardQuerySchema.parse(query);

    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const orders = await prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: startDate, lte: endDate },
        status: { in: ['confirmed', 'shipped', 'completed'] },
      },
      select: { orderDate: true, grandTotal: true },
    });

    const daily: Record<string, number> = {};
    orders.forEach(o => {
      const date = o.orderDate.toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + toNumber(o.grandTotal);
    });

    return Object.entries(daily)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopProducts(limit = 10) {
    const items = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { unit: true },
    });

    return items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product,
        quantitySold: toNumber(item._sum.quantity),
        revenue: toNumber(item._sum.total),
      };
    });
  }

  async getTopCustomers(limit = 10) {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        invoices: {
          where: { status: { in: ['paid', 'partial', 'sent'] } },
          include: { payments: true },
        },
      },
      take: limit * 2,
    });

    return customers
      .map(c => ({
        customer: { id: c.id, code: c.code, name: c.name },
        totalInvoices: c.invoices.length,
        totalRevenue: c.invoices.reduce((sum, i) => sum + toNumber(i.grandTotal), 0),
        totalPaid: c.invoices.reduce((sum, i) => sum + i.payments.reduce((s, p) => s + toNumber(p.amount), 0), 0),
        outstanding: c.invoices.reduce((sum, i) => sum + toNumber(i.grandTotal) - i.payments.reduce((s, p) => s + toNumber(p.amount), 0), 0),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }
}

export const dashboardService = new DashboardService();