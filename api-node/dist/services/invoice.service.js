"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceService = exports.InvoiceService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const base_service_js_1 = require("./base.service.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_2 = require("./base.service.js");
const invoice_validators_1 = require("../validators/invoice.validators");
class InvoiceService extends base_service_js_2.BaseService {
    async getAll(query) {
        const { page, limit, search, customerId, status, dateFrom, dateTo, sortBy, sortOrder } = invoice_validators_1.invoiceQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_2.getPaginationParams)(page, limit);
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
            where.invoiceDate = {};
            if (dateFrom)
                where.invoiceDate.gte = new Date(dateFrom);
            if (dateTo)
                where.invoiceDate.lte = new Date(dateTo);
        }
        const [invoices, total] = await Promise.all([
            prisma_js_1.default.invoice.findMany({
                where,
                include: {
                    customer: { select: { id: true, code: true, name: true } },
                    salesOrder: { select: { id: true, number: true } },
                    user: { select: { id: true, name: true } },
                    items: {
                        include: { product: { select: { id: true, code: true, name: true, unit: { select: { abbreviation: true } } } } },
                    },
                    payments: { select: { id: true, amount: true, paidAt: true, method: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.invoice.count({ where }),
        ]);
        return (0, base_service_js_2.createPaginatedResult)(invoices, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.invoice, id, {
            customer: true,
            salesOrder: true,
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: { include: { unit: true } }, salesOrderItem: true } },
            payments: true,
        });
    }
    async generateNumber() {
        const date = new Date();
        const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const seq = await prisma_js_1.default.documentSequence.upsert({
            where: { sequenceKey_period: { sequenceKey: 'INV', period } },
            update: { number: { increment: 1 } },
            create: { sequenceKey: 'INV', period, number: 1 },
        });
        return `INV-${period}-${String(seq.number).padStart(6, '0')}`;
    }
    async create(data, userId) {
        await prisma_js_1.default.customer.findUniqueOrThrow({ where: { id: data.customerId } });
        if (data.salesOrderId)
            await prisma_js_1.default.salesOrder.findUniqueOrThrow({ where: { id: data.salesOrderId } });
        for (const item of data.items) {
            if (item.productId)
                await prisma_js_1.default.product.findUniqueOrThrow({ where: { id: item.productId } });
            if (item.salesOrderItemId)
                await prisma_js_1.default.salesOrderItem.findUniqueOrThrow({ where: { id: item.salesOrderItemId } });
        }
        const number = await this.generateNumber();
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0);
        const taxTotal = data.items.reduce((sum, item) => {
            const taxable = item.quantity * item.unitPrice - item.discount;
            return sum + taxable * item.taxRate / 100;
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
            const invoice = await tx.invoice.create({
                data: {
                    number,
                    customerId: data.customerId,
                    salesOrderId: data.salesOrderId,
                    userId,
                    invoiceDate: new Date(data.invoiceDate),
                    dueDate: data.dueDate ? new Date(data.dueDate) : null,
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
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
                            salesOrderItemId: item.salesOrderItemId,
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discount: item.discount,
                            taxRate: item.taxRate,
                            subtotal: item.quantity * item.unitPrice - item.discount,
                            taxAmount: (item.quantity * item.unitPrice - item.discount) * item.taxRate / 100,
                            total: (item.quantity * item.unitPrice - item.discount) * (1 + item.taxRate / 100),
                        })),
                    },
                },
                include: {
                    customer: true,
                    salesOrder: true,
                    user: { select: { id: true, name: true } },
                    items: { include: { product: { include: { unit: true } }, salesOrderItem: true } },
                    payments: true,
                },
            });
            if (data.salesOrderId) {
                await tx.salesOrder.update({ where: { id: data.salesOrderId }, data: { status: 'completed', completedAt: new Date() } });
            }
            return invoice;
        });
    }
    async update(id, data) {
        const invoice = await this.findByIdOrThrow(prisma_js_1.default.invoice, id, { items: true });
        if (data.customerId)
            await prisma_js_1.default.customer.findUniqueOrThrow({ where: { id: data.customerId } });
        if (data.salesOrderId)
            await prisma_js_1.default.salesOrder.findUniqueOrThrow({ where: { id: data.salesOrderId } });
        if (data.items) {
            for (const item of data.items) {
                if (item.productId)
                    await prisma_js_1.default.product.findUniqueOrThrow({ where: { id: item.productId } });
                if (item.salesOrderItemId)
                    await prisma_js_1.default.salesOrderItem.findUniqueOrThrow({ where: { id: item.salesOrderItemId } });
            }
        }
        let subtotal = invoice.subtotal;
        let taxTotal = invoice.taxTotal;
        let discountAmount = invoice.discountAmount;
        let grandTotal = invoice.grandTotal;
        if (data.items || data.discountType || data.discountValue || data.shipping !== undefined) {
            const items = data.items || invoice.items;
            const discountType = data.discountType || invoice.discountType;
            const discountValue = data.discountValue !== undefined ? data.discountValue : invoice.discountValue;
            const shipping = data.shipping !== undefined ? data.shipping : invoice.shipping;
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
                await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
                await tx.invoiceItem.createMany({
                    data: data.items.map((item) => ({
                        invoiceId: id,
                        productId: item.productId,
                        salesOrderItemId: item.salesOrderItemId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        taxRate: item.taxRate,
                        subtotal: item.quantity * item.unitPrice - item.discount,
                        taxAmount: (item.quantity * item.unitPrice - item.discount) * item.taxRate / 100,
                        total: (item.quantity * item.unitPrice - item.discount) * (1 + item.taxRate / 100),
                    })),
                });
            }
            return tx.invoice.update({
                where: { id },
                data: {
                    ...data,
                    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    subtotal,
                    taxTotal,
                    discountAmount,
                    grandTotal,
                },
                include: {
                    customer: true,
                    salesOrder: true,
                    user: { select: { id: true, name: true } },
                    items: { include: { product: { include: { unit: true } }, salesOrderItem: true } },
                    payments: true,
                },
            });
        });
    }
    async updateStatus(id, status) {
        const invoice = await this.findByIdOrThrow(prisma_js_1.default.invoice, id);
        const updateData = { status };
        if (status === 'sent' && invoice.status === 'draft')
            updateData.sentAt = new Date();
        if (status === 'paid')
            updateData.paidAt = new Date();
        if (status === 'cancelled')
            updateData.cancelledAt = new Date();
        return prisma_js_1.default.invoice.update({ where: { id }, data: updateData });
    }
    async addPayment(invoiceId, data, userId) {
        const invoice = await this.findByIdOrThrow(prisma_js_1.default.invoice, invoiceId);
        if (data.invoiceId && data.invoiceId !== invoiceId)
            throw new errorHandler_js_1.AppError('Invoice ID mismatch', 400);
        const paymentNumber = await this.generatePaymentNumber();
        return prisma_js_1.default.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    number: paymentNumber,
                    invoiceId,
                    customerId: data.customerId || invoice.customerId,
                    userId,
                    amount: data.amount,
                    paidAt: new Date(data.paidAt),
                    method: data.method,
                    reference: data.reference,
                    note: data.note,
                },
            });
            const totalPaid = (await tx.payment.aggregate({ where: { id: invoiceId }, _sum: { amount: true } }))._sum.amount || 0;
            let newStatus = invoice.status;
            if ((0, base_service_js_1.toNumber)(totalPaid) >= (0, base_service_js_1.toNumber)(invoice.grandTotal))
                newStatus = 'paid';
            else if ((0, base_service_js_1.toNumber)(totalPaid) > 0)
                newStatus = 'partial';
            await tx.invoice.update({
                where: { id: invoiceId },
                data: { paidAmount: totalPaid, status: newStatus, paidAt: newStatus === 'paid' ? new Date() : undefined },
            });
            return payment;
        });
    }
    async generatePaymentNumber() {
        const date = new Date();
        const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const seq = await prisma_js_1.default.documentSequence.upsert({
            where: { sequenceKey_period: { sequenceKey: 'PAY', period } },
            update: { number: { increment: 1 } },
            create: { sequenceKey: 'PAY', period, number: 1 },
        });
        return `PAY-${period}-${String(seq.number).padStart(6, '0')}`;
    }
    async delete(id) {
        await this.findByIdOrThrow(prisma_js_1.default.invoice, id);
        await prisma_js_1.default.invoice.delete({ where: { id } });
    }
}
exports.InvoiceService = InvoiceService;
exports.invoiceService = new InvoiceService();
//# sourceMappingURL=invoice.service.js.map