"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salesOrder_controller_js_1 = require("../controllers/salesOrder.controller.js");
const salesOrder_validators_1 = require("../validators/salesOrder.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', salesOrder_controller_js_1.getSalesOrders);
router.get('/:id', salesOrder_controller_js_1.getSalesOrder);
router.post('/', (0, validateRequest_js_1.validateRequest)(salesOrder_validators_1.createSalesOrderSchema), salesOrder_controller_js_1.createSalesOrder);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(salesOrder_validators_1.updateSalesOrderSchema), salesOrder_controller_js_1.updateSalesOrder);
router.patch('/:id/status', salesOrder_controller_js_1.updateSalesOrderStatus);
router.delete('/:id', salesOrder_controller_js_1.deleteSalesOrder);
exports.default = router;
//# sourceMappingURL=salesOrder.routes.js.map