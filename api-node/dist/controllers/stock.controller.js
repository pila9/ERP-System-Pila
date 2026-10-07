"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockValuation = exports.getLowStock = exports.createStockMovement = exports.getStockMovements = exports.getStockLevels = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const stock_service_js_1 = require("../services/stock.service.js");
exports.getStockLevels = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await stock_service_js_1.stockService.getLevels(req.query);
    res.json(result);
});
exports.getStockMovements = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const result = await stock_service_js_1.stockService.getMovements(req.query);
    res.json(result);
});
exports.createStockMovement = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const movement = await stock_service_js_1.stockService.createMovement(req.body, user.id);
    res.status(201).json(movement);
});
exports.getLowStock = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { warehouseId } = req.query;
    const lowStock = await stock_service_js_1.stockService.getLowStock(warehouseId);
    res.json(lowStock);
});
exports.getStockValuation = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { warehouseId } = req.query;
    const valuation = await stock_service_js_1.stockService.getStockValuation(warehouseId);
    res.json(valuation);
});
//# sourceMappingURL=stock.controller.js.map