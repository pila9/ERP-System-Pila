"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_js_1 = require("../controllers/customer.controller.js");
const customer_validators_1 = require("../validators/customer.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', customer_controller_js_1.getCustomers);
router.get('/:id', customer_controller_js_1.getCustomer);
router.post('/', (0, validateRequest_js_1.validateRequest)(customer_validators_1.createCustomerSchema), customer_controller_js_1.createCustomer);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(customer_validators_1.updateCustomerSchema), customer_controller_js_1.updateCustomer);
router.delete('/:id', customer_controller_js_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map