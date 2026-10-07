"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.createRole = exports.getRole = exports.getRoles = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const role_service_js_1 = require("../services/role.service.js");
const role_validators_1 = require("../validators/role.validators");
exports.getRoles = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await role_service_js_1.roleService.getAll(req.query);
    res.json(result);
});
exports.getRole = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const role = await role_service_js_1.roleService.getById(req.params.id);
    res.json(role);
});
exports.createRole = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = role_validators_1.createRoleSchema.parse(req.body);
    const role = await role_service_js_1.roleService.create(data);
    res.status(201).json(role);
});
exports.updateRole = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = role_validators_1.updateRoleSchema.parse(req.body);
    const role = await role_service_js_1.roleService.update(req.params.id, data);
    res.json(role);
});
exports.deleteRole = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await role_service_js_1.roleService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=role.controller.js.map