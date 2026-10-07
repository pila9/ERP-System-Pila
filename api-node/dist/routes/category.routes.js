"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_js_1 = require("../controllers/category.controller.js");
const category_validators_1 = require("../validators/category.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', category_controller_js_1.getCategories);
router.get('/tree', category_controller_js_1.getCategoryTree);
router.get('/:id', category_controller_js_1.getCategory);
router.post('/', (0, validateRequest_js_1.validateRequest)(category_validators_1.createCategorySchema), category_controller_js_1.createCategory);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(category_validators_1.updateCategorySchema), category_controller_js_1.updateCategory);
router.delete('/:id', category_controller_js_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map