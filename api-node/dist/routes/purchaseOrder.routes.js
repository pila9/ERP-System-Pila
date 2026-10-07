"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchaseOrder_controller_js_1 = require("../controllers/purchaseOrder.controller.js");
const purchaseOrder_validators_1 = require("../validators/purchaseOrder.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', purchaseOrder_controller_js_1.getPurchaseOrders);
router.get('/:id', purchaseOrder_controller_js_1.getPurchaseOrder);
router.post('/', (0, validateRequest_js_1.validateRequest)(purchaseOrder_validators_1.createPurchaseOrderSchema), purchaseOrder_controller_js_1.createPurchaseOrder);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(purchaseOrder_validators_1.updatePurchaseOrderSchema), purchaseOrder_controller_js_1.updatePurchaseOrder);
router.patch('/:id/status', purchaseOrder_controller_js_1.updatePurchaseOrderStatus);
router.post('/:id/receive', purchaseOrder_controller_js_1.receivePurchaseOrder);
router.delete('/:id', purchaseOrder_controller_js_1.deletePurchaseOrder);
exports.default = router;
//# sourceMappingURL=purchaseOrder.routes.js.map