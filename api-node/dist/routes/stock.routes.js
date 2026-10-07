"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controller_js_1 = require("../controllers/stock.controller.js");
const router = (0, express_1.Router)();
router.get('/levels', stock_controller_js_1.getStockLevels);
router.get('/movements', stock_controller_js_1.getStockMovements);
router.post('/movements', stock_controller_js_1.createStockMovement);
router.get('/low-stock', stock_controller_js_1.getLowStock);
router.get('/valuation', stock_controller_js_1.getStockValuation);
exports.default = router;
//# sourceMappingURL=stock.routes.js.map