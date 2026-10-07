"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWarehouse = exports.updateWarehouse = exports.createWarehouse = exports.getWarehouse = exports.getWarehouses = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const warehouse_service_js_1 = require("../services/warehouse.service.js");
const warehouse_validators_1 = require("../validators/warehouse.validators");
exports.getWarehouses = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await warehouse_service_js_1.warehouseService.getAll(req.query);
    res.json(result);
});
exports.getWarehouse = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const warehouse = await warehouse_service_js_1.warehouseService.getById(req.params.id);
    res.json(warehouse);
});
exports.createWarehouse = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = warehouse_validators_1.createWarehouseSchema.parse(req.body);
    const warehouse = await warehouse_service_js_1.warehouseService.create(data);
    res.status(201).json(warehouse);
});
exports.updateWarehouse = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = warehouse_validators_1.updateWarehouseSchema.parse(req.body);
    const warehouse = await warehouse_service_js_1.warehouseService.update(req.params.id, data);
    res.json(warehouse);
});
exports.deleteWarehouse = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await warehouse_service_js_1.warehouseService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=warehouse.controller.js.map