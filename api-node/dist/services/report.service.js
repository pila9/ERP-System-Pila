"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const report_validators_1 = require("../validators/report.validators");
const base_service_js_1 = require("./base.service.js");
class ReportService {
    async getSalesReport(query) {
        const { dateFrom, dateTo, warehouseId, categoryId } = report_validators_1.reportQuerySchema.parse(query);
        const where = {
            status: { in: ['confirmed', 'shipped', 'completed'] },
        };
        if (dateFrom || dateTo) {
            where.orderDate = {};
            if (dateFrom)
                where.orderDate.gte = new Date(dateFrom);
            if (dateTo)
                where.orderDate.lte = new Date(dateTo);
        }
        if (warehouseId)
            where.warehouseId = warehouseId;
        const orders = await prisma_js_1.default.salesOrder.findMany({
            where,
            include: {
                items: {
                    include: { product: { include: { category: true } } },
                },
            },
        });
        const byProduct = {};
        const byCategory = {};
        for (const order of orders) {
            for (const item of order.items) {
                const pKey = item.productId;
                if (!byProduct[pKey]) {
                    byProduct[pKey] = { name: item.product.name, code: item.product.code, quantity: 0, revenue: 0 };
                }
                byProduct[pKey].quantity += (0, base_service_js_1.toNumber)(item.quantity);
                byProduct[pKey].revenue += (0, base_service_js_1.toNumber)(item.total);
                const cKey = item.product.categoryId || 'uncategorized';
                const cName = item.product.category?.name || 'Uncategorized';
                if (!byCategory[cKey]) {
                    byCategory[cKey] = { name: cName, quantity: 0, revenue: 0 };
                }
                byCategory[cKey].quantity += (0, base_service_js_1.toNumber)(item.quantity);
                byCategory[cKey].revenue += (0, base_service_js_1.toNumber)(item.total);
            }
        }
        return {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (0, base_service_js_1.toNumber)(o.grandTotal), 0),
            byProduct: Object.values(byProduct).sort((a, b) => b.revenue - a.revenue),
            byCategory: Object.values(byCategory).sort((a, b) => b.revenue - a.revenue),
        };
    }
    async getPurchaseReport(query) {
        const { dateFrom, dateTo, warehouseId } = report_validators_1.reportQuerySchema.parse(query);
        const where = { status: { in: ['ordered', 'received'] } };
        if (dateFrom || dateTo) {
            where.orderDate = {};
            if (dateFrom)
                where.orderDate.gte = new Date(dateFrom);
            if (dateTo)
                where.orderDate.lte = new Date(dateTo);
        }
        if (warehouseId)
            where.warehouseId = warehouseId;
        const orders = await prisma_js_1.default.purchaseOrder.findMany({
            where,
            include: { supplier: true, items: { include: { product: { include: { category: true } } } } },
        });
        const byProduct = {};
        const bySupplier = {};
        for (const order of orders) {
            for (const item of order.items) {
                const pKey = item.productId;
                if (!byProduct[pKey]) {
                    byProduct[pKey] = { name: item.product.name, code: item.product.code, quantity: 0, cost: 0 };
                }
                byProduct[pKey].quantity += (0, base_service_js_1.toNumber)(item.quantity);
                byProduct[pKey].cost += (0, base_service_js_1.toNumber)(item.total);
            }
            const sKey = order.supplierId;
            if (!bySupplier[sKey]) {
                bySupplier[sKey] = { name: order.supplier.name, orders: 0, total: 0 };
            }
            bySupplier[sKey].orders += 1;
            bySupplier[sKey].total += (0, base_service_js_1.toNumber)(order.grandTotal);
        }
        return {
            totalOrders: orders.length,
            totalCost: orders.reduce((sum, o) => sum + (0, base_service_js_1.toNumber)(o.grandTotal), 0),
            byProduct: Object.values(byProduct).sort((a, b) => b.cost - a.cost),
            bySupplier: Object.values(bySupplier).sort((a, b) => b.total - a.total),
        };
    }
    async getInventoryReport(query) {
        const { warehouseId, categoryId } = report_validators_1.reportQuerySchema.parse(query);
        const where = { product: { trackInventory: true, isActive: true } };
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (categoryId)
            where.product.categoryId = categoryId;
        const levels = await prisma_js_1.default.stockLevel.findMany({
            where,
            include: { product: { include: { unit: true, category: true } }, warehouse: true },
        });
        const byWarehouse = {};
        const byCategory = {};
        for (const level of levels) {
            const wKey = level.warehouseId;
            if (!byWarehouse[wKey]) {
                byWarehouse[wKey] = { name: level.warehouse.name, items: 0, value: 0 };
            }
            byWarehouse[wKey].items += 1;
            byWarehouse[wKey].value += (0, base_service_js_1.toNumber)(level.quantity) * (0, base_service_js_1.toNumber)(level.product.costPrice);
            const cKey = level.product.categoryId || 'uncategorized';
            const cName = level.product.category?.name || 'Uncategorized';
            if (!byCategory[cKey]) {
                byCategory[cKey] = { name: cName, items: 0, value: 0 };
            }
            byCategory[cKey].items += 1;
            byCategory[cKey].value += (0, base_service_js_1.toNumber)(level.quantity) * (0, base_service_js_1.toNumber)(level.product.costPrice);
        }
        return {
            totalItems: levels.length,
            totalValue: levels.reduce((sum, l) => sum + (0, base_service_js_1.toNumber)(l.quantity) * (0, base_service_js_1.toNumber)(l.product.costPrice), 0),
            byWarehouse: Object.values(byWarehouse),
            byCategory: Object.values(byCategory),
        };
    }
    async getReceivablesReport(query) {
        const { dateFrom, dateTo } = report_validators_1.reportQuerySchema.parse(query);
        const where = { status: { in: ['sent', 'partial'] } };
        if (dateFrom || dateTo) {
            where.invoiceDate = {};
            if (dateFrom)
                where.invoiceDate.gte = new Date(dateFrom);
            if (dateTo)
                where.invoiceDate.lte = new Date(dateTo);
        }
        const invoices = await prisma_js_1.default.invoice.findMany({
            where,
            include: { customer: true, payments: true },
        });
        const byCustomer = {};
        for (const inv of invoices) {
            const paid = inv.payments.reduce((sum, p) => sum + (0, base_service_js_1.toNumber)(p.amount), 0);
            const outstanding = (0, base_service_js_1.toNumber)(inv.grandTotal) - paid;
            if (!byCustomer[inv.customerId]) {
                byCustomer[inv.customerId] = { name: inv.customer.name, invoices: 0, total: 0, paid: 0, outstanding: 0 };
            }
            byCustomer[inv.customerId].invoices += 1;
            byCustomer[inv.customerId].total += (0, base_service_js_1.toNumber)(inv.grandTotal);
            byCustomer[inv.customerId].paid += paid;
            byCustomer[inv.customerId].outstanding += outstanding;
        }
        return {
            totalOutstanding: invoices.reduce((sum, i) => sum + ((0, base_service_js_1.toNumber)(i.grandTotal) - i.payments.reduce((s, p) => s + (0, base_service_js_1.toNumber)(p.amount), 0)), 0),
            byCustomer: Object.values(byCustomer).sort((a, b) => b.outstanding - a.outstanding),
        };
    }
    async getPayablesReport(query) {
        const { dateFrom, dateTo } = report_validators_1.reportQuerySchema.parse(query);
        const where = { status: { in: ['ordered', 'received'] } };
        if (dateFrom || dateTo) {
            where.orderDate = {};
            if (dateFrom)
                where.orderDate.gte = new Date(dateFrom);
            if (dateTo)
                where.orderDate.lte = new Date(dateTo);
        }
        const orders = await prisma_js_1.default.purchaseOrder.findMany({
            where,
            include: { supplier: true },
        });
        const bySupplier = {};
        for (const order of orders) {
            const total = (0, base_service_js_1.toNumber)(order.grandTotal);
            if (!bySupplier[order.supplierId]) {
                bySupplier[order.supplierId] = { name: order.supplier.name, orders: 0, total: 0, paid: 0, outstanding: 0 };
            }
            bySupplier[order.supplierId].orders += 1;
            bySupplier[order.supplierId].total += total;
            bySupplier[order.supplierId].outstanding += total;
        }
        return {
            totalOutstanding: orders.reduce((sum, o) => sum + (0, base_service_js_1.toNumber)(o.grandTotal), 0),
            bySupplier: Object.values(bySupplier).sort((a, b) => b.outstanding - a.outstanding),
        };
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();
//# sourceMappingURL=report.service.js.map