"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const auth_js_1 = require("./middleware/auth.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./routes/user.routes.js"));
const role_routes_js_1 = __importDefault(require("./routes/role.routes.js"));
const category_routes_js_1 = __importDefault(require("./routes/category.routes.js"));
const unit_routes_js_1 = __importDefault(require("./routes/unit.routes.js"));
const warehouse_routes_js_1 = __importDefault(require("./routes/warehouse.routes.js"));
const product_routes_js_1 = __importDefault(require("./routes/product.routes.js"));
const customer_routes_js_1 = __importDefault(require("./routes/customer.routes.js"));
const supplier_routes_js_1 = __importDefault(require("./routes/supplier.routes.js"));
const salesOrder_routes_js_1 = __importDefault(require("./routes/salesOrder.routes.js"));
const purchaseOrder_routes_js_1 = __importDefault(require("./routes/purchaseOrder.routes.js"));
const invoice_routes_js_1 = __importDefault(require("./routes/invoice.routes.js"));
const stock_routes_js_1 = __importDefault(require("./routes/stock.routes.js"));
const report_routes_js_1 = __importDefault(require("./routes/report.routes.js"));
const dashboard_routes_js_1 = __importDefault(require("./routes/dashboard.routes.js"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/users', auth_js_1.authMiddleware, user_routes_js_1.default);
app.use('/api/roles', auth_js_1.authMiddleware, role_routes_js_1.default);
app.use('/api/categories', auth_js_1.authMiddleware, category_routes_js_1.default);
app.use('/api/units', auth_js_1.authMiddleware, unit_routes_js_1.default);
app.use('/api/warehouses', auth_js_1.authMiddleware, warehouse_routes_js_1.default);
app.use('/api/products', auth_js_1.authMiddleware, product_routes_js_1.default);
app.use('/api/customers', auth_js_1.authMiddleware, customer_routes_js_1.default);
app.use('/api/suppliers', auth_js_1.authMiddleware, supplier_routes_js_1.default);
app.use('/api/sales-orders', auth_js_1.authMiddleware, salesOrder_routes_js_1.default);
app.use('/api/purchase-orders', auth_js_1.authMiddleware, purchaseOrder_routes_js_1.default);
app.use('/api/invoices', auth_js_1.authMiddleware, invoice_routes_js_1.default);
app.use('/api/stock', auth_js_1.authMiddleware, stock_routes_js_1.default);
app.use('/api/reports', auth_js_1.authMiddleware, report_routes_js_1.default);
app.use('/api/dashboard', auth_js_1.authMiddleware, dashboard_routes_js_1.default);
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler_js_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map