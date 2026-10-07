"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.addPayment = exports.updateInvoiceStatus = exports.updateInvoice = exports.createInvoice = exports.getInvoice = exports.getInvoices = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const invoice_service_js_1 = require("../services/invoice.service.js");
const invoice_validators_1 = require("../validators/invoice.validators");
exports.getInvoices = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await invoice_service_js_1.invoiceService.getAll(req.query);
    res.json(result);
});
exports.getInvoice = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const invoice = await invoice_service_js_1.invoiceService.getById(req.params.id);
    res.json(invoice);
});
exports.createInvoice = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = invoice_validators_1.createInvoiceSchema.parse(req.body);
    const invoice = await invoice_service_js_1.invoiceService.create(data, user.id);
    res.status(201).json(invoice);
});
exports.updateInvoice = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = invoice_validators_1.updateInvoiceSchema.parse(req.body);
    const invoice = await invoice_service_js_1.invoiceService.update(req.params.id, data);
    res.json(invoice);
});
exports.updateInvoiceStatus = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { status } = req.body;
    const invoice = await invoice_service_js_1.invoiceService.updateStatus(req.params.id, status);
    res.json(invoice);
});
exports.addPayment = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = invoice_validators_1.createPaymentSchema.parse(req.body);
    const payment = await invoice_service_js_1.invoiceService.addPayment(req.params.id, data, user.id);
    res.status(201).json(payment);
});
exports.deleteInvoice = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await invoice_service_js_1.invoiceService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=invoice.controller.js.map