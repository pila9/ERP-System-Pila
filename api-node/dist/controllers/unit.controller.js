"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnit = exports.updateUnit = exports.createUnit = exports.getUnit = exports.getUnits = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const unit_service_js_1 = require("../services/unit.service.js");
const unit_validators_1 = require("../validators/unit.validators");
exports.getUnits = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await unit_service_js_1.unitService.getAll(req.query);
    res.json(result);
});
exports.getUnit = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const unit = await unit_service_js_1.unitService.getById(req.params.id);
    res.json(unit);
});
exports.createUnit = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = unit_validators_1.createUnitSchema.parse(req.body);
    const unit = await unit_service_js_1.unitService.create(data);
    res.status(201).json(unit);
});
exports.updateUnit = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = unit_validators_1.updateUnitSchema.parse(req.body);
    const unit = await unit_service_js_1.unitService.update(req.params.id, data);
    res.json(unit);
});
exports.deleteUnit = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await unit_service_js_1.unitService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=unit.controller.js.map