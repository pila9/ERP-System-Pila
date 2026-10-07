"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesOrderService = exports.SalesOrderService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const base_service_js_1 = require("./base.service.js");
const salesOrder_validators_1 = require("../validators/salesOrder.validators");
class SalesOrderService extends base_service_js_1.BaseService {
    async getAll(query, userId) {
        const { page, limit, search, customerId, status, dateFrom, dateTo, sortBy, sortOrder } = salesOrder_validators_1.salesOrderQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { number: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (customerId)
            where.customerId = customerId;
        if (status)
            where.status = status;
        if (dateFrom || dateTo) {
            where.orderDate = {};
            if (dateFrom)
                where.orderDate.gte = new Date(dateFrom);
            if (dateTo)
                where.orderDate.lte = new Date(dateTo);
        }
        const [orders, total] = await Promise.all([
            prisma_js_1.default.salesOrder.findMany({
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
            prisma_js_1.default.salesOrder.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(orders, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.salesOrder, id, {
            customer: true,
            user: { select: { id: true, name: true, email: true } },
            warehouse: true,
            items: { include: { product: { include: { unit: true } }, warehouse: true } },
        });
    }
    async generateNumber() {
        const date = new Date();
        const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const seq = await prisma_js_1.default.documentSequence.upsert({
            where: { sequenceKey_period: { sequenceKey: 'SO', period } },
            update: { number: { increment: 1 } },
            create: { sequenceKey: 'SO', period, number: 1 },
        });
        return `SO-${period}-${String(seq.number).padStart(6, '0')}`;
    }
    async create(data, userId) {
        await prisma_js_1.default.customer.findUniqueOrThrow({ where: { id: data.customerId } });
        if (data.warehouseId)
            await prisma_js_1.default.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });
        for (const item of data.items) {
            await prisma_js_1.default.product.findUniqueOrThrow({ where: { id: item.productId } });
            if (item.warehouseId)
                await prisma_js_1.default.warehouse.findUniqueOrThrow({ where: { id: item.warehouseId } });
        }
        const number = await this.generateNumber();
        const subtotal = data.items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unitPrice - item.discount;
            return sum + itemSubtotal;
        }, 0);
        const taxTotal = data.items.reduce((sum, item) => {
            const taxable = item.quantity * item.unitPrice - item.discount;
            return sum + (taxable * item.taxRate / 100);
        }, 0);
        let discountAmount = 0;
        if (data.discountType === 'percentage') {
            discountAmount = subtotal * data.discountValue / 100;
        }
        else {
            discountAmount = data.discountValue;
        }
        const grandTotal = subtotal + taxTotal + data.shipping - discountAmount;
        return prisma_js_1.default.$transaction(async (tx) => {
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
                        create: data.items.map((item) => ({
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
    async update(id, data) {
        const order = await this.findByIdOrThrow(prisma_js_1.default.salesOrder, id, { items: true });
        if (data.customerId)
            await prisma_js_1.default.customer.findUniqueOrThrow({ where: { id: data.customerId } });
        if (data.warehouseId)
            await prisma_js_1.default.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });
        if (data.items) {
            for (const item of data.items) {
                await prisma_js_1.default.product.findUniqueOrThrow({ where: { id: item.productId } });
                if (item.warehouseId)
                    await prisma_js_1.default.warehouse.findUniqueOrThrow({ where: { id: item.warehouseId } });
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
            subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0);
            taxTotal = items.reduce((sum, item) => {
                const taxable = item.quantity * item.unitPrice - item.discount;
                return sum + taxable * item.taxRate / 100;
            }, 0);
            if (discountType === 'percentage') {
                discountAmount = subtotal * discountValue / 100;
            }
            else {
                discountAmount = discountValue;
            }
            grandTotal = subtotal + taxTotal + shipping - discountAmount;
        }
        return prisma_js_1.default.$transaction(async (tx) => {
            if (data.items) {
                await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
                await tx.salesOrderItem.createMany({
                    data: data.items.map((item) => ({
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
    async updateStatus(id, status) {
        const order = await this.findByIdOrThrow(prisma_js_1.default.salesOrder, id);
        const updateData = { status };
        if (status === 'confirmed' && order.status === 'draft')
            updateData.confirmedAt = new Date();
        if (status === 'shipped' && order.status === 'confirmed')
            updateData.shippedAt = new Date();
        if (status === 'completed' && order.status === 'shipped')
            updateData.completedAt = new Date();
        if (status === 'cancelled')
            updateData.cancelledAt = new Date();
        return prisma_js_1.default.salesOrder.update({ where: { id }, data: updateData });
    }
    async delete(id) {
        await this.findByIdOrThrow(prisma_js_1.default.salesOrder, id);
        await prisma_js_1.default.salesOrder.delete({ where: { id } });
    }
}
exports.SalesOrderService = SalesOrderService;
exports.salesOrderService = new SalesOrderService();
//# sourceMappingURL=salesOrder.service.js.map