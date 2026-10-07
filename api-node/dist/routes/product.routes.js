"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_js_1 = require("../controllers/product.controller.js");
const product_validators_1 = require("../validators/product.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', product_controller_js_1.getProducts);
router.get('/:id', product_controller_js_1.getProduct);
router.post('/', (0, validateRequest_js_1.validateRequest)(product_validators_1.createProductSchema), product_controller_js_1.createProduct);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(product_validators_1.updateProductSchema), product_controller_js_1.updateProduct);
router.delete('/:id', product_controller_js_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map