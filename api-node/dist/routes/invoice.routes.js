"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_js_1 = require("../controllers/invoice.controller.js");
const invoice_validators_1 = require("../validators/invoice.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', invoice_controller_js_1.getInvoices);
router.get('/:id', invoice_controller_js_1.getInvoice);
router.post('/', (0, validateRequest_js_1.validateRequest)(invoice_validators_1.createInvoiceSchema), invoice_controller_js_1.createInvoice);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(invoice_validators_1.updateInvoiceSchema), invoice_controller_js_1.updateInvoice);
router.patch('/:id/status', invoice_controller_js_1.updateInvoiceStatus);
router.post('/:id/payments', (0, validateRequest_js_1.validateRequest)(invoice_validators_1.createPaymentSchema), invoice_controller_js_1.addPayment);
router.delete('/:id', invoice_controller_js_1.deleteInvoice);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map