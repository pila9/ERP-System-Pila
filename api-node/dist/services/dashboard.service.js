"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const report_validators_1 = require("../validators/report.validators");
const base_service_js_1 = require("./base.service.js");
class DashboardService {
    async getOverview(query) {
        const { dateFrom, dateTo } = report_validators_1.dashboardQuerySchema.parse(query);
        const dateFilter = {};
        if (dateFrom || dateTo) {
            if (dateFrom)
                dateFilter.gte = new Date(dateFrom);
            if (dateTo)
                dateFilter.lte = new Date(dateTo);
        }
        const [salesOrders, purchaseOrders, invoices, products, customers, suppliers] = await Promise.all([
            prisma_js_1.default.salesOrder.count({
                where: { orderDate: dateFilter, status: { in: ['confirmed', 'shipped', 'completed'] } },
            }),
            prisma_js_1.default.purchaseOrder.count({ where: { orderDate: dateFilter } }),
            prisma_js_1.default.invoice.count({ where: { invoiceDate: dateFilter } }),
            prisma_js_1.default.product.count({ where: { isActive: true } }),
            prisma_js_1.default.customer.count({ where: { isActive: true } }),
            prisma_js_1.default.supplier.count({ where: { isActive: true } }),
        ]);
        const [salesRevenue, purchaseCost, outstandingReceivables, outstandingPayables] = await Promise.all([
            prisma_js_1.default.salesOrder.aggregate({
                where: { orderDate: dateFilter, status: { in: ['confirmed', 'shipped', 'completed'] } },
                _sum: { grandTotal: true },
            }),
            prisma_js_1.default.purchaseOrder.aggregate({
                where: { orderDate: dateFilter, status: { in: ['ordered', 'received'] } },
                _sum: { grandTotal: true },
            }),
            prisma_js_1.default.invoice.aggregate({
                where: { status: { in: ['sent', 'partial'] } },
                _sum: { grandTotal: true },
            }),
            prisma_js_1.default.purchaseOrder.aggregate({
                where: { status: { in: ['ordered', 'received'] } },
                _sum: { grandTotal: true },
            }),
        ]);
        // low stock is computed client-side (reorderLevel lives on Product)
        const lowLevels = await prisma_js_1.default.stockLevel.findMany({
            where: { product: { trackInventory: true, isActive: true } },
            include: { product: true },
        });
        const lowStockCount = lowLevels.filter(l => (0, base_service_js_1.toNumber)(l.quantity) <= (0, base_service_js_1.toNumber)(l.product.reorderLevel)).length;
        const recentSalesOrders = await prisma_js_1.default.salesOrder.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: { select: { name: true } }, items: { take: 1, include: { product: { select: { name: true } } } } },
        });
        const recentInvoices = await prisma_js_1.default.invoice.findMany({
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
                salesRevenue: (0, base_service_js_1.toNumber)(salesRevenue._sum.grandTotal),
                purchaseCost: (0, base_service_js_1.toNumber)(purchaseCost._sum.grandTotal),
                outstandingReceivables: (0, base_service_js_1.toNumber)(outstandingReceivables._sum.grandTotal),
                outstandingPayables: (0, base_service_js_1.toNumber)(outstandingPayables._sum.grandTotal),
                lowStockCount,
            },
            recentSalesOrders,
            recentInvoices,
        };
    }
    async getSalesChart(query) {
        const { dateFrom, dateTo } = report_validators_1.dashboardQuerySchema.parse(query);
        const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = dateTo ? new Date(dateTo) : new Date();
        const orders = await prisma_js_1.default.salesOrder.findMany({
            where: {
                orderDate: { gte: startDate, lte: endDate },
                status: { in: ['confirmed', 'shipped', 'completed'] },
            },
            select: { orderDate: true, grandTotal: true },
        });
        const daily = {};
        orders.forEach(o => {
            const date = o.orderDate.toISOString().split('T')[0];
            daily[date] = (daily[date] || 0) + (0, base_service_js_1.toNumber)(o.grandTotal);
        });
        return Object.entries(daily)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    async getTopProducts(limit = 10) {
        const items = await prisma_js_1.default.salesOrderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { total: 'desc' } },
            take: limit,
        });
        const productIds = items.map(i => i.productId);
        const products = await prisma_js_1.default.product.findMany({
            where: { id: { in: productIds } },
            include: { unit: true },
        });
        return items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                product,
                quantitySold: (0, base_service_js_1.toNumber)(item._sum.quantity),
                revenue: (0, base_service_js_1.toNumber)(item._sum.total),
            };
        });
    }
    async getTopCustomers(limit = 10) {
        const customers = await prisma_js_1.default.customer.findMany({
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
            totalRevenue: c.invoices.reduce((sum, i) => sum + (0, base_service_js_1.toNumber)(i.grandTotal), 0),
            totalPaid: c.invoices.reduce((sum, i) => sum + i.payments.reduce((s, p) => s + (0, base_service_js_1.toNumber)(p.amount), 0), 0),
            outstanding: c.invoices.reduce((sum, i) => sum + (0, base_service_js_1.toNumber)(i.grandTotal) - i.payments.reduce((s, p) => s + (0, base_service_js_1.toNumber)(p.amount), 0), 0),
        }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
    }
}
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
//# sourceMappingURL=dashboard.service.js.map