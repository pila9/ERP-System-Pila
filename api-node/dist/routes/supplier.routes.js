"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_js_1 = require("../controllers/supplier.controller.js");
const supplier_validators_1 = require("../validators/supplier.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', supplier_controller_js_1.getSuppliers);
router.get('/:id', supplier_controller_js_1.getSupplier);
router.post('/', (0, validateRequest_js_1.validateRequest)(supplier_validators_1.createSupplierSchema), supplier_controller_js_1.createSupplier);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(supplier_validators_1.updateSupplierSchema), supplier_controller_js_1.updateSupplier);
router.delete('/:id', supplier_controller_js_1.deleteSupplier);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map