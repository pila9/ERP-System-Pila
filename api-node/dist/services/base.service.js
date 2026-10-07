"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
exports.toNumber = toNumber;
exports.getPaginationParams = getPaginationParams;
exports.createPaginatedResult = createPaginatedResult;
const prisma_js_1 = __importDefault(require("../utils/prisma.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const library_1 = require("@prisma/client/runtime/library");
function toNumber(value) {
    if (value == null)
        return 0;
    if (typeof value === 'number')
        return value;
    if (value instanceof library_1.Decimal)
        return Number(value);
    if (typeof value.toNumber === 'function')
        return value.toNumber();
    return Number(value);
}
function getPaginationParams(page, limit) {
    const skip = (page - 1) * limit;
    return { page, limit, skip, take: limit };
}
function createPaginatedResult(data, total, page, limit) {
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}
class BaseService {
    prisma = prisma_js_1.default;
    async findById(model, id, include) {
        return model.findUnique({ where: { id }, include });
    }
    async findByIdOrThrow(model, id, include) {
        const record = await this.findById(model, id, include);
        if (!record)
            throw new errorHandler_js_1.AppError('Record not found', 404);
        return record;
    }
    async softDelete(model, id) {
        await this.findByIdOrThrow(model, id);
        await model.update({ where: { id }, data: { isActive: false } });
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base.service.js.map