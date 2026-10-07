"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getProfile = exports.register = exports.login = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_service_js_1 = require("../services/auth.service.js");
const auth_validators_1 = require("../validators/auth.validators");
exports.login = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { email, password } = auth_validators_1.loginSchema.parse(req.body);
    const result = await auth_service_js_1.authService.login(email, password);
    res.json(result);
});
exports.register = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = auth_validators_1.registerSchema.parse(req.body);
    const result = await auth_service_js_1.authService.register(data);
    res.status(201).json(result);
});
exports.getProfile = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const profile = await auth_service_js_1.authService.getProfile(user.id);
    res.json(profile);
});
exports.changePassword = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { currentPassword, newPassword } = auth_validators_1.changePasswordSchema.parse(req.body);
    const result = await auth_service_js_1.authService.changePassword(user.id, currentPassword, newPassword);
    res.json(result);
});
//# sourceMappingURL=auth.controller.js.map