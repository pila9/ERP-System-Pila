"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayablesReport = exports.getReceivablesReport = exports.getInventoryReport = exports.getPurchaseReport = exports.getSalesReport = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const report_service_js_1 = require("../services/report.service.js");
exports.getSalesReport = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await report_service_js_1.reportService.getSalesReport(req.query);
    res.json(report);
});
exports.getPurchaseReport = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await report_service_js_1.reportService.getPurchaseReport(req.query);
    res.json(report);
});
exports.getInventoryReport = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await report_service_js_1.reportService.getInventoryReport(req.query);
    res.json(report);
});
exports.getReceivablesReport = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await report_service_js_1.reportService.getReceivablesReport(req.query);
    res.json(report);
});
exports.getPayablesReport = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const report = await report_service_js_1.reportService.getPayablesReport(req.query);
    res.json(report);
});
//# sourceMappingURL=report.controller.js.map