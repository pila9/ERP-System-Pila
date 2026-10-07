"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockService = exports.StockService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const stock_validators_1 = require("../validators/stock.validators");
class StockService extends base_service_js_1.BaseService {
    async getLevels(query) {
        const { page, limit, productId, warehouseId, lowStock } = stock_validators_1.stockLevelQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (productId)
            where.productId = productId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        // lowStock is applied as a client-side filter (reorderLevel lives on Product)
        const [levels, total] = await Promise.all([
            prisma_js_1.default.stockLevel.findMany({
                where,
                include: {
                    product: { include: { unit: true } },
                    warehouse: true,
                },
                orderBy: { product: { name: 'asc' } },
                skip,
                take,
            }),
            prisma_js_1.default.stockLevel.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(levels, total, page, limit);
    }
    async getMovements(query) {
        const { page, limit, productId, warehouseId, type, dateFrom, dateTo, sortBy, sortOrder } = stock_validators_1.stockMovementQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (productId)
            where.productId = productId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (type)
            where.type = type;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        const [movements, total] = await Promise.all([
            prisma_js_1.default.stockMovement.findMany({
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
            prisma_js_1.default.stockMovement.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(movements, total, page, limit);
    }
    async createMovement(data, userId) {
        const { productId, warehouseId, toWarehouseId, type, quantity, unitCost, referenceId, referenceType, note } = stock_validators_1.stockMovementSchema.parse(data);
        const product = await prisma_js_1.default.product.findUniqueOrThrow({ where: { id: productId } });
        const warehouse = await prisma_js_1.default.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });
        if (toWarehouseId)
            await prisma_js_1.default.warehouse.findUniqueOrThrow({ where: { id: toWarehouseId } });
        return prisma_js_1.default.$transaction(async (tx) => {
            let balanceAfter = 0;
            if (type === 'in' || type === 'return') {
                const level = await tx.stockLevel.upsert({
                    where: { productId_warehouseId: { productId, warehouseId } },
                    update: { quantity: { increment: quantity } },
                    create: { productId, warehouseId, quantity },
                });
                balanceAfter = (0, base_service_js_1.toNumber)(level.quantity);
            }
            else if (type === 'out') {
                const level = await tx.stockLevel.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
                if (!level || (0, base_service_js_1.toNumber)(level.quantity) < (0, base_service_js_1.toNumber)(quantity)) {
                    throw new errorHandler_js_1.AppError('Insufficient stock', 400);
                }
                const updated = await tx.stockLevel.update({
                    where: { productId_warehouseId: { productId, warehouseId } },
                    data: { quantity: { decrement: quantity } },
                });
                balanceAfter = (0, base_service_js_1.toNumber)(updated.quantity);
            }
            else if (type === 'transfer') {
                if (!toWarehouseId)
                    throw new errorHandler_js_1.AppError('Destination warehouse required for transfer', 400);
                if (toWarehouseId === warehouseId)
                    throw new errorHandler_js_1.AppError('Cannot transfer to same warehouse', 400);
                const fromLevel = await tx.stockLevel.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
                if (!fromLevel || (0, base_service_js_1.toNumber)(fromLevel.quantity) < (0, base_service_js_1.toNumber)(quantity)) {
                    throw new errorHandler_js_1.AppError('Insufficient stock in source warehouse', 400);
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
                balanceAfter = (0, base_service_js_1.toNumber)(toLevel.quantity);
            }
            else if (type === 'adjustment') {
                const level = await tx.stockLevel.upsert({
                    where: { productId_warehouseId: { productId, warehouseId } },
                    update: { quantity: quantity },
                    create: { productId, warehouseId, quantity },
                });
                balanceAfter = (0, base_service_js_1.toNumber)(level.quantity);
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
    async getLowStock(warehouseId) {
        const where = {
            product: { trackInventory: true, isActive: true },
        };
        if (warehouseId)
            where.warehouseId = warehouseId;
        const levels = await prisma_js_1.default.stockLevel.findMany({
            where,
            include: { product: { include: { unit: true } }, warehouse: true },
        });
        return levels.filter(l => (0, base_service_js_1.toNumber)(l.quantity) <= (0, base_service_js_1.toNumber)(l.product.reorderLevel));
    }
    async getStockValuation(warehouseId) {
        const where = { product: { trackInventory: true } };
        if (warehouseId)
            where.warehouseId = warehouseId;
        const levels = await prisma_js_1.default.stockLevel.findMany({
            where,
            include: { product: true },
        });
        return levels.map(l => ({
            product: l.product,
            quantity: (0, base_service_js_1.toNumber)(l.quantity),
            unitCost: (0, base_service_js_1.toNumber)(l.product.costPrice),
            totalValue: (0, base_service_js_1.toNumber)(l.quantity) * (0, base_service_js_1.toNumber)(l.product.costPrice),
        }));
    }
}
exports.StockService = StockService;
exports.stockService = new StockService();
//# sourceMappingURL=stock.service.js.map