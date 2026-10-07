"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopCustomers = exports.getTopProducts = exports.getSalesChart = exports.getDashboardOverview = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const dashboard_service_js_1 = require("../services/dashboard.service.js");
exports.getDashboardOverview = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const overview = await dashboard_service_js_1.dashboardService.getOverview(req.query);
    res.json(overview);
});
exports.getSalesChart = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const chart = await dashboard_service_js_1.dashboardService.getSalesChart(req.query);
    res.json(chart);
});
exports.getTopProducts = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const products = await dashboard_service_js_1.dashboardService.getTopProducts(limit);
    res.json(products);
});
exports.getTopCustomers = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const customers = await dashboard_service_js_1.dashboardService.getTopCustomers(limit);
    res.json(customers);
});
//# sourceMappingURL=dashboard.controller.js.map