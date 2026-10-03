<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WarehouseController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ERP API
|--------------------------------------------------------------------------
| All routes below are prefixed with /api and protected with Sanctum tokens
| (except the auth endpoints).
*/

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    // ---------- Authentication ----------
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/logout-all', [AuthController::class, 'logoutAll']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('auth/password', [AuthController::class, 'changePassword']);

    // ---------- Dashboard ----------
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->middleware('permission:reports.view');

    // ---------- Catalogue ----------
    Route::get('categories', [CategoryController::class, 'index'])->middleware('permission:products.view');
    Route::post('categories', [CategoryController::class, 'store'])->middleware('permission:categories.manage');
    Route::get('categories/{category}', [CategoryController::class, 'show'])->middleware('permission:products.view');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->middleware('permission:categories.manage');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:categories.manage');

    Route::get('units', [UnitController::class, 'index'])->middleware('permission:products.view');
    Route::post('units', [UnitController::class, 'store'])->middleware('permission:categories.manage');
    Route::put('units/{unit}', [UnitController::class, 'update'])->middleware('permission:categories.manage');
    Route::delete('units/{unit}', [UnitController::class, 'destroy'])->middleware('permission:categories.manage');

    // ---------- Products ----------
    Route::get('products', [ProductController::class, 'index'])->middleware('permission:products.view');
    Route::post('products', [ProductController::class, 'store'])->middleware('permission:products.create');
    Route::get('products/{product}', [ProductController::class, 'show'])->middleware('permission:products.view');
    Route::put('products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete');

    // ---------- Warehouses ----------
    Route::get('warehouses', [WarehouseController::class, 'index'])->middleware('permission:products.view');
    Route::post('warehouses', [WarehouseController::class, 'store'])->middleware('permission:warehouses.manage');
    Route::get('warehouses/{warehouse}', [WarehouseController::class, 'show'])->middleware('permission:products.view');
    Route::put('warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('permission:warehouses.manage');
    Route::delete('warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->middleware('permission:warehouses.manage');

    // ---------- Inventory ----------
    Route::get('stock/levels', [StockController::class, 'levels'])->middleware('permission:stock.view');
    Route::get('stock/summary', [StockController::class, 'summary'])->middleware('permission:stock.view');
    Route::get('stock/low', [StockController::class, 'lowStock'])->middleware('permission:stock.view');
    Route::get('stock/movements', [StockController::class, 'movements'])->middleware('permission:stock.view');
    Route::post('stock/adjustments', [StockController::class, 'adjust'])->middleware('permission:stock.adjust');
    Route::post('stock/transfers', [StockController::class, 'transfer'])->middleware('permission:stock.transfer');

    // ---------- Customers ----------
    Route::get('customers', [CustomerController::class, 'index'])->middleware('permission:customers.view');
    Route::post('customers', [CustomerController::class, 'store'])->middleware('permission:customers.create');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->middleware('permission:customers.view');
    Route::put('customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:customers.update');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->middleware('permission:customers.delete');

    // ---------- Suppliers ----------
    Route::get('suppliers', [SupplierController::class, 'index'])->middleware('permission:suppliers.view');
    Route::post('suppliers', [SupplierController::class, 'store'])->middleware('permission:suppliers.create');
    Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('permission:suppliers.view');
    Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.update');
    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('permission:suppliers.delete');

    // ---------- Sales orders ----------
    Route::get('sales-orders', [SalesOrderController::class, 'index'])->middleware('permission:sales.view');
    Route::post('sales-orders', [SalesOrderController::class, 'store'])->middleware('permission:sales.create');
    Route::get('sales-orders/{salesOrder}', [SalesOrderController::class, 'show'])->middleware('permission:sales.view');
    Route::put('sales-orders/{salesOrder}', [SalesOrderController::class, 'update'])->middleware('permission:sales.update');
    Route::delete('sales-orders/{salesOrder}', [SalesOrderController::class, 'destroy'])->middleware('permission:sales.delete');
    Route::post('sales-orders/{salesOrder}/confirm', [SalesOrderController::class, 'confirm'])->middleware('permission:sales.confirm');
    Route::post('sales-orders/{salesOrder}/ship', [SalesOrderController::class, 'ship'])->middleware('permission:sales.ship');
    Route::post('sales-orders/{salesOrder}/complete', [SalesOrderController::class, 'complete'])->middleware('permission:sales.complete');
    Route::post('sales-orders/{salesOrder}/cancel', [SalesOrderController::class, 'cancel'])->middleware('permission:sales.update');
    Route::post('sales-orders/{salesOrder}/invoice', [InvoiceController::class, 'fromOrder'])->middleware('permission:invoices.create');

    // ---------- Invoices ----------
    Route::get('invoices', [InvoiceController::class, 'index'])->middleware('permission:invoices.view');
    Route::post('invoices', [InvoiceController::class, 'store'])->middleware('permission:invoices.create');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:invoices.view');
    Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:invoices.update');
    Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:invoices.delete');
    Route::get('invoices/{invoice}/print', [InvoiceController::class, 'print'])->middleware('permission:invoices.view');
    Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send'])->middleware('permission:invoices.send');
    Route::post('invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])->middleware('permission:invoices.update');
    Route::post('invoices/{invoice}/payments', [InvoiceController::class, 'addPayment'])->middleware('permission:invoices.payment');

    // ---------- Payments ----------
    Route::get('payments', [PaymentController::class, 'index'])->middleware('permission:invoices.payment,invoices.view');
    Route::get('payments/{payment}', [PaymentController::class, 'show'])->middleware('permission:invoices.view');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->middleware('permission:invoices.payment');

    // ---------- Purchase orders ----------
    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->middleware('permission:purchases.view');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:purchases.create');
    Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->middleware('permission:purchases.view');
    Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->middleware('permission:purchases.update');
    Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:purchases.delete');
    Route::post('purchase-orders/{purchaseOrder}/place', [PurchaseOrderController::class, 'place'])->middleware('permission:purchases.approve');
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->middleware('permission:purchases.receive');
    Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->middleware('permission:purchases.update');

    // ---------- Reports ----------
    Route::get('reports/sales-summary', [ReportController::class, 'salesSummary'])->middleware('permission:reports.view');
    Route::get('reports/sales-by-customer', [ReportController::class, 'salesByCustomer'])->middleware('permission:reports.view');
    Route::get('reports/top-products', [ReportController::class, 'topProducts'])->middleware('permission:reports.view');
    Route::get('reports/stock-valuation', [ReportController::class, 'stockValuation'])->middleware('permission:reports.view');
    Route::get('reports/low-stock', [ReportController::class, 'lowStock'])->middleware('permission:reports.view');
    Route::get('reports/receivables', [ReportController::class, 'receivables'])->middleware('permission:reports.view');
    Route::get('reports/payables', [ReportController::class, 'payables'])->middleware('permission:reports.view');
    Route::get('reports/stock-movements', [ReportController::class, 'stockMovements'])->middleware('permission:reports.view');
    Route::get('reports/profit-loss', [ReportController::class, 'profitAndLoss'])->middleware('permission:reports.view');

    // ---------- Administration ----------
    Route::get('users', [UserController::class, 'index'])->middleware('permission:users.manage');
    Route::post('users', [UserController::class, 'store'])->middleware('permission:users.manage');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:users.manage');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:users.manage');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.manage');

    Route::get('roles', [RoleController::class, 'index'])->middleware('permission:roles.manage,users.manage');
    Route::get('roles/permissions', [RoleController::class, 'permissions'])->middleware('permission:roles.manage,users.manage');
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:roles.manage');
    Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles.manage,users.manage');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.manage');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.manage');
});