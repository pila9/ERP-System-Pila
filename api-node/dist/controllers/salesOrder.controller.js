"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSalesOrder = exports.updateSalesOrderStatus = exports.updateSalesOrder = exports.createSalesOrder = exports.getSalesOrder = exports.getSalesOrders = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const salesOrder_service_js_1 = require("../services/salesOrder.service.js");
const salesOrder_validators_1 = require("../validators/salesOrder.validators");
exports.getSalesOrders = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await salesOrder_service_js_1.salesOrderService.getAll(req.query, user.id);
    res.json(result);
});
exports.getSalesOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const order = await salesOrder_service_js_1.salesOrderService.getById(req.params.id);
    res.json(order);
});
exports.createSalesOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = salesOrder_validators_1.createSalesOrderSchema.parse(req.body);
    const order = await salesOrder_service_js_1.salesOrderService.create(data, user.id);
    res.status(201).json(order);
});
exports.updateSalesOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = salesOrder_validators_1.updateSalesOrderSchema.parse(req.body);
    const order = await salesOrder_service_js_1.salesOrderService.update(req.params.id, data);
    res.json(order);
});
exports.updateSalesOrderStatus = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { status } = req.body;
    const order = await salesOrder_service_js_1.salesOrderService.updateStatus(req.params.id, status);
    res.json(order);
});
exports.deleteSalesOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await salesOrder_service_js_1.salesOrderService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=salesOrder.controller.js.map