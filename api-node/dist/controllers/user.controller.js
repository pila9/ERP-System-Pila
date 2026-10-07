"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const user_service_js_1 = require("../services/user.service.js");
const user_validators_1 = require("../validators/user.validators");
exports.getUsers = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await user_service_js_1.userService.getAll(req.query);
    res.json(result);
});
exports.getUser = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await user_service_js_1.userService.getById(req.params.id);
    res.json(user);
});
exports.createUser = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = user_validators_1.createUserSchema.parse(req.body);
    const user = await user_service_js_1.userService.create(data);
    res.status(201).json(user);
});
exports.updateUser = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = user_validators_1.updateUserSchema.parse(req.body);
    const user = await user_service_js_1.userService.update(req.params.id, data);
    res.json(user);
});
exports.deleteUser = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await user_service_js_1.userService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=user.controller.js.map