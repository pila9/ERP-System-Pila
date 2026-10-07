"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateRequest = void 0;
const errorHandler_js_1 = require("./errorHandler.js");
const validateRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            throw new errorHandler_js_1.AppError('Validation failed', 400);
        }
        req.body = result.data;
        next();
    };
};
exports.validateRequest = validateRequest;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            throw new errorHandler_js_1.AppError('Invalid query parameters', 400);
        }
        req.query = result.data;
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            throw new errorHandler_js_1.AppError('Invalid parameters', 400);
        }
        req.params = result.data;
        next();
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validateRequest.js.map