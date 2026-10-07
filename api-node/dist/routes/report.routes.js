"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_js_1 = require("../controllers/report.controller.js");
const router = (0, express_1.Router)();
router.get('/sales', report_controller_js_1.getSalesReport);
router.get('/purchases', report_controller_js_1.getPurchaseReport);
router.get('/inventory', report_controller_js_1.getInventoryReport);
router.get('/receivables', report_controller_js_1.getReceivablesReport);
router.get('/payables', report_controller_js_1.getPayablesReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map