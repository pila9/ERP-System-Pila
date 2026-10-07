"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_js_1 = require("../middleware/auth.js");
const base_service_js_1 = require("./base.service.js");
class AuthService extends base_service_js_1.BaseService {
    async login(email, password) {
        const user = await prisma_js_1.default.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user || !user.isActive) {
            throw new errorHandler_js_1.AppError('Invalid credentials', 401);
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            throw new errorHandler_js_1.AppError('Invalid credentials', 401);
        }
        await prisma_js_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const token = (0, auth_js_1.generateToken)({
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
        });
        return {
            user: {
                id: user.id,
                code: user.code,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                roleId: user.roleId,
                role: user.role,
                isActive: user.isActive,
            },
            token,
        };
    }
    async register(data) {
        const existing = await prisma_js_1.default.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new errorHandler_js_1.AppError('Email already registered', 409);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_js_1.default.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                roleId: data.roleId,
            },
            include: { role: true },
        });
        const token = (0, auth_js_1.generateToken)({
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
        });
        return { user, token };
    }
    async getProfile(userId) {
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user)
            throw new errorHandler_js_1.AppError('User not found', 404);
        return {
            id: user.id,
            code: user.code,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            roleId: user.roleId,
            role: user.role,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
        };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_js_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new errorHandler_js_1.AppError('User not found', 404);
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValid)
            throw new errorHandler_js_1.AppError('Current password is incorrect', 400);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_js_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: 'Password changed successfully' };
    }
    verifyToken(token) {
        return (0, auth_js_1.verifyToken)(token);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map