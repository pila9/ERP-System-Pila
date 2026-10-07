"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const product_service_js_1 = require("../services/product.service.js");
const product_validators_1 = require("../validators/product.validators");
exports.getProducts = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await product_service_js_1.productService.getAll(req.query);
    res.json(result);
});
exports.getProduct = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const product = await product_service_js_1.productService.getById(req.params.id);
    res.json(product);
});
exports.createProduct = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = product_validators_1.createProductSchema.parse(req.body);
    const product = await product_service_js_1.productService.create(data);
    res.status(201).json(product);
});
exports.updateProduct = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = product_validators_1.updateProductSchema.parse(req.body);
    const product = await product_service_js_1.productService.update(req.params.id, data);
    res.json(product);
});
exports.deleteProduct = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    await product_service_js_1.productService.delete(req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=product.controller.js.map