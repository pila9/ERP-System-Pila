"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePurchaseOrder = exports.receivePurchaseOrder = exports.updatePurchaseOrderStatus = exports.updatePurchaseOrder = exports.createPurchaseOrder = exports.getPurchaseOrder = exports.getPurchaseOrders = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const purchaseOrder_service_js_1 = require("../services/purchaseOrder.service.js");
const purchaseOrder_validators_1 = require("../validators/purchaseOrder.validators");
exports.getPurchaseOrders = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await purchaseOrder_service_js_1.purchaseOrderService.getAll(req.query, user.id);
    res.json(result);
});
exports.getPurchaseOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const order = await purchaseOrder_service_js_1.purchaseOrderService.getById(req.params.id);
    res.json(order);
});
exports.createPurchaseOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = purchaseOrder_validators_1.createPurchaseOrderSchema.parse(req.body);
    const order = await purchaseOrder_service_js_1.purchaseOrderService.create(data, user.id);
    res.status(201).json(order);
});
exports.updatePurchaseOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = purchaseOrder_validators_1.updatePurchaseOrderSchema.parse(req.body);
    const order = await purchaseOrder_service_js_1.purchaseOrderService.update(req.params.id, data);
    res.json(order);
});
exports.updatePurchaseOrderStatus = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { status } = req.body;
    const order = await purchaseOrder_service_js_1.purchaseOrderService.updateStatus(req.params.id, status);
    res.json(order);
});
exports.receivePurchaseOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { items } = req.body;
    const order = await purchaseOrder_service_js_1.purchaseOrderService.receive(req.params.id, items);
    res.json(order);
});
exports.deletePurchaseOrder = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await purchaseOrder_service_js_1.purchaseOrderService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=purchaseOrder.controller.js.map