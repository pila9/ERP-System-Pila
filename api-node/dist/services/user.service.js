"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const user_validators_1 = require("../validators/user.validators");
class UserService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, roleId, isActive, sortBy, sortOrder } = user_validators_1.userQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (roleId)
            where.roleId = roleId;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [users, total] = await Promise.all([
            prisma_js_1.default.user.findMany({
                where,
                include: { role: { select: { id: true, name: true, slug: true } } },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.user.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(users, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.user, id, { role: true });
    }
    async create(data) {
        const existing = await prisma_js_1.default.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new errorHandler_js_1.AppError('Email already exists', 409);
        if (data.code) {
            const codeExists = await prisma_js_1.default.user.findUnique({ where: { code: data.code } });
            if (codeExists)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        return prisma_js_1.default.user.create({
            data: { ...data, password: hashedPassword },
            include: { role: { select: { id: true, name: true, slug: true } } },
        });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.user, id);
        if (data.email) {
            const existing = await prisma_js_1.default.user.findUnique({ where: { email: data.email } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Email already exists', 409);
        }
        if (data.code) {
            const existing = await prisma_js_1.default.user.findUnique({ where: { code: data.code } });
            if (existing && existing.id !== id)
                throw new errorHandler_js_1.AppError('Code already exists', 409);
        }
        if (data.password) {
            data.password = await bcryptjs_1.default.hash(data.password, 10);
        }
        return prisma_js_1.default.user.update({
            where: { id },
            data,
            include: { role: { select: { id: true, name: true, slug: true } } },
        });
    }
    async delete(id) {
        await this.findByIdOrThrow(prisma_js_1.default.user, id);
        await prisma_js_1.default.user.delete({ where: { id } });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map