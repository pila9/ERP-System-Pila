"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = exports.RoleService = void 0;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const base_service_js_1 = require("./base.service.js");
const role_validators_1 = require("../validators/role.validators");
class RoleService extends base_service_js_1.BaseService {
    async getAll(query) {
        const { page, limit, search, isSystem, sortBy, sortOrder } = role_validators_1.roleQuerySchema.parse(query);
        const { skip, take } = (0, base_service_js_1.getPaginationParams)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isSystem !== undefined)
            where.isSystem = isSystem;
        const [roles, total] = await Promise.all([
            prisma_js_1.default.role.findMany({
                where,
                include: { _count: { select: { users: true } } },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            prisma_js_1.default.role.count({ where }),
        ]);
        return (0, base_service_js_1.createPaginatedResult)(roles, total, page, limit);
    }
    async getById(id) {
        return this.findByIdOrThrow(prisma_js_1.default.role, id, { users: { select: { id: true, name: true, email: true } } });
    }
    async create(data) {
        const existing = await prisma_js_1.default.role.findUnique({ where: { slug: data.slug } });
        if (existing)
            throw new errorHandler_js_1.AppError('Role slug already exists', 409);
        return prisma_js_1.default.role.create({ data });
    }
    async update(id, data) {
        await this.findByIdOrThrow(prisma_js_1.default.role, id);
        const role = await prisma_js_1.default.role.findUnique({ where: { id } });
        if (role?.isSystem)
            throw new errorHandler_js_1.AppError('Cannot modify system roles', 403);
        return prisma_js_1.default.role.update({ where: { id }, data });
    }
    async delete(id) {
        const role = await this.findByIdOrThrow(prisma_js_1.default.role, id);
        if (role.isSystem)
            throw new errorHandler_js_1.AppError('Cannot delete system roles', 403);
        const userCount = await prisma_js_1.default.user.count({ where: { roleId: id } });
        if (userCount > 0)
            throw new errorHandler_js_1.AppError('Cannot delete role with assigned users', 400);
        await prisma_js_1.default.role.delete({ where: { id } });
    }
}
exports.RoleService = RoleService;
exports.roleService = new RoleService();
//# sourceMappingURL=role.service.js.map