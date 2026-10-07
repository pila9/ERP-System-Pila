"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const customer_validators_1 = require("../validators/customer.validators");
class CustomerService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, isActive, sortBy, sortOrder } = customer_validators_1.customerQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        const [customers, total] = await Promise.all([
            prisma_js_1.default.customer.findMany({
                where,
                include: { _count: { select: { salesOrders: true, invoices: true } } },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.customer.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(customers, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.customer, id, {
            _count: { select: { salesOrders: true, invoices: true } },
        });
    }
    async create(data) {
        const existing = await prisma_js_1.default.customer.findUnique({ where: { code: data.code } });
        if (existing)
            throw new errorHandler_js_1.AppError('Code already exists', 409);
        return prisma_js_1.default.customer.create({ data });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.customer, id);
        if (data.code) {
            const existing = await prisma_js_1.default.customer.findUnique({ where: { code: data.code } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        return prisma_js_1.default.customer.update({ where: { id }, data });
    }
    async delete(id) {
        const count = await prisma_js_1.default.salesOrder.count({ where: { customerId: id } });
        if (count > 0)
            throw new errorHandler_js_1.AppError('Cannot delete customer with sales orders', 400);
        await prisma_js_1.default.customer.delete({ where: { id } });
    }
}
exports.CustomerService = CustomerService;
exports.customerService = new CustomerService();
//# sourceMappingURL=customer.service.js.map