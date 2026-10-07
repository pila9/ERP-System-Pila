"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.getCategoryTree = exports.getCategories = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const category_service_js_1 = require("../services/category.service.js");
const category_validators_1 = require("../validators/category.validators");
exports.getCategories = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await category_service_js_1.categoryService.getAll(req.query);
    res.json(result);
});
exports.getCategoryTree = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const tree = await category_service_js_1.categoryService.getTree();
    res.json(tree);
});
exports.getCategory = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const category = await category_service_js_1.categoryService.getById(req.params.id);
    res.json(category);
});
exports.createCategory = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = category_validators_1.createCategorySchema.parse(req.body);
    const category = await category_service_js_1.categoryService.create(data);
    res.status(201).json(category);
});
exports.updateCategory = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = category_validators_1.updateCategorySchema.parse(req.body);
    const category = await category_service_js_1.categoryService.update(req.params.id, data);
    res.json(category);
});
exports.deleteCategory = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await category_service_js_1.categoryService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=category.controller.js.map