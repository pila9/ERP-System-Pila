"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplier = exports.getSuppliers = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const supplier_service_js_1 = require("../services/supplier.service.js");
const supplier_validators_1 = require("../validators/supplier.validators");
exports.getSuppliers = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await supplier_service_js_1.supplierService.getAll(req.query);
    res.json(result);
});
exports.getSupplier = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const supplier = await supplier_service_js_1.supplierService.getById(req.params.id);
    res.json(supplier);
});
exports.createSupplier = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = supplier_validators_1.createSupplierSchema.parse(req.body);
    const supplier = await supplier_service_js_1.supplierService.create(data);
    res.status(201).json(supplier);
});
exports.updateSupplier = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = supplier_validators_1.updateSupplierSchema.parse(req.body);
    const supplier = await supplier_service_js_1.supplierService.update(req.params.id, data);
    res.json(supplier);
});
exports.deleteSupplier = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await supplier_service_js_1.supplierService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=supplier.controller.js.map