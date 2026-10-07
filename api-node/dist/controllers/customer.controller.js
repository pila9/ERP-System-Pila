"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomer = exports.getCustomers = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const customer_service_js_1 = require("../services/customer.service.js");
const customer_validators_1 = require("../validators/customer.validators");
exports.getCustomers = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await customer_service_js_1.customerService.getAll(req.query);
    res.json(result);
});
exports.getCustomer = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const customer = await customer_service_js_1.customerService.getById(req.params.id);
    res.json(customer);
});
exports.createCustomer = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = customer_validators_1.createCustomerSchema.parse(req.body);
    const customer = await customer_service_js_1.customerService.create(data);
    res.status(201).json(customer);
});
exports.updateCustomer = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = customer_validators_1.updateCustomerSchema.parse(req.body);
    const customer = await customer_service_js_1.customerService.update(req.params.id, data);
    res.json(customer);
});
exports.deleteCustomer = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await customer_service_js_1.customerService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=customer.controller.js.map