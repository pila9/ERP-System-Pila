"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_js_1 = require("../controllers/dashboard.controller.js");
const router = (0, express_1.Router)();
router.get('/overview', dashboard_controller_js_1.getDashboardOverview);
router.get('/sales-chart', dashboard_controller_js_1.getSalesChart);
router.get('/top-products', dashboard_controller_js_1.getTopProducts);
router.get('/top-customers', dashboard_controller_js_1.getTopCustomers);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map