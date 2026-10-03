<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\StockLevel;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseApiController
{
    public function index(Request $request)
    {
        $from = $this->dateFrom($request, 'from') ?? now()->startOfMonth()->toDateString();
        $to = $this->dateFrom($request, 'to') ?? now()->endOfMonth()->toDateString();
        $previousFrom = now()->parse($from)->subDays(now()->parse($from)->diffInDays(now()->parse($to)))->toDateString();

        $salesTotal = (float) SalesOrder::query()
            ->between($from, $to)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('grand_total');

        $previousSales = (float) SalesOrder::query()
            ->between($previousFrom, now()->parse($from)->subDay()->toDateString())
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('grand_total');

        $invoiceTotal = (float) Invoice::query()->between($from, $to)->sum('grand_total');
        $cashCollected = (float) \App\Models\Payment::query()->between($from, $to)->sum('amount');
        $previousCollected = (float) \App\Models\Payment::query()
            ->between($previousFrom, now()->parse($from)->subDay()->toDateString())
            ->sum('amount');

        $stockRows = StockLevel::query()->with('product')->get();

        $stockValue = (float) $stockRows->sum(fn ($l) => (float) $l->quantity * (float) $l->product?->cost_price);

        $openOrders = SalesOrder::query()->whereIn('status', ['draft', 'confirmed'])->count();
        $openInvoices = Invoice::query()->outstanding()->count();
        $receivable = (float) Invoice::query()->outstanding()->sum('grand_total') - (float) Invoice::query()->outstanding()->sum('paid_amount');

        $openPurchaseOrders = PurchaseOrder::query()->whereIn('status', ['ordered', 'partial'])->count();
        $payable = (float) PurchaseOrder::query()->whereIn('status', ['ordered', 'partial', 'received'])->sum('grand_total');

        $lowStockQuery = Product::query()
            ->where('is_active', true)
            ->where('track_inventory', true)
            ->where(function ($q) {
                $q->whereHas('stockLevels', fn ($l) => $l->whereColumn('stock_levels.quantity', '<=', 'products.reorder_level'))
                    ->orWhereDoesntHave('stockLevels');
            });

        $lowStockCount = (clone $lowStockQuery)->count();

        $lowStock = (clone $lowStockQuery)
            ->with('category')
            ->orderBy('name')
            ->limit(8)
            ->get();

        $salesByMonth = $this->salesTrend();
        $topProducts = $this->topProducts($from, $to);
        $recentOrders = SalesOrder::query()
            ->with('customer')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (SalesOrder $order) => [
                'id' => $order->id,
                'number' => $order->number,
                'customer' => $order->customer?->name,
                'status' => $order->status,
                'grand_total' => (float) $order->grand_total,
                'order_date' => $order->order_date?->toDateString(),
            ]);

        $recentPayments = \App\Models\Payment::query()
            ->with('customer')
            ->orderByDesc('paid_at')
            ->limit(6)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'number' => $p->number,
                'customer' => $p->customer?->name,
                'amount' => (float) $p->amount,
                'method' => $p->method,
                'paid_at' => $p->paid_at?->toIso8601String(),
            ]);

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'kpis' => [
                'sales_total' => round($salesTotal, 2),
                'sales_change_percent' => $this->percentChange($salesTotal, $previousSales),
                'invoiced_total' => round($invoiceTotal, 2),
                'cash_collected' => round($cashCollected, 2),
                'cash_change_percent' => $this->percentChange($cashCollected, $previousCollected),
                'stock_value' => round($stockValue, 2),
                'receivable' => round($receivable, 2),
                'payable' => round($payable, 2),
                'open_sales_orders' => $openOrders,
                'open_invoices' => $openInvoices,
                'open_purchase_orders' => $openPurchaseOrders,
                'products_count' => Product::query()->count(),
                'active_products_count' => Product::query()->where('is_active', true)->count(),
                'customers_count' => Customer::query()->count(),
                'active_customers_count' => Customer::query()->where('is_active', true)->count(),
                'suppliers_count' => \App\Models\Supplier::query()->count(),
                'users_count' => \App\Models\User::query()->where('is_active', true)->count(),
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => Product::query()
                    ->where('track_inventory', true)
                    ->whereHas('stockLevels', fn ($l) => $l->where('quantity', '<=', 0))
                    ->count(),
                'stock_movements_today' => StockMovement::query()->whereDate('created_at', today())->count(),
            ],
            'sales_trend' => $salesByMonth,
            'top_products' => $topProducts,
            'low_stock' => $lowStock->map(fn (Product $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'category' => $p->category?->name,
                'total_stock' => (float) $p->total_stock,
                'reorder_level' => (float) $p->reorder_level,
                'stock_status' => $p->stock_status,
            ])->all(),
            'recent_orders' => $recentOrders,
            'recent_payments' => $recentPayments,
            'order_status_breakdown' => SalesOrder::query()
                ->selectRaw('status, COUNT(*) as order_count, COALESCE(SUM(grand_total), 0) as amount')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn ($row) => [
                    'status' => $row->status,
                    'count' => (int) $row->order_count,
                    'amount' => round((float) $row->amount, 2),
                ])->all(),
        ]);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function salesTrend(): array
    {
        $months = 6;

        $rows = DB::table('sales_orders')
            ->selectRaw("DATE_FORMAT(order_date, '%Y-%m') as period, COALESCE(SUM(grand_total), 0) as total, COUNT(*) as orders")
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->where('order_date', '>=', now()->subMonths($months - 1)->startOfMonth()->toDateString())
            ->groupBy('period')
            ->pluck('total', 'period');

        $counts = DB::table('sales_orders')
            ->selectRaw("DATE_FORMAT(order_date, '%Y-%m') as period, COUNT(*) as orders")
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->where('order_date', '>=', now()->subMonths($months - 1)->startOfMonth()->toDateString())
            ->groupBy('period')
            ->pluck('orders', 'period');

        $result = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $key = $date->format('Y-m');

            $result[] = [
                'period' => $key,
                'label' => $date->format('M Y'),
                'total' => round((float) ($rows[$key] ?? 0), 2),
                'orders' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $result;
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function topProducts(string $from, string $to, int $limit = 5): array
    {
        $rows = DB::table('sales_order_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'products.id', '=', 'sales_order_items.product_id')
            ->whereBetween('sales_orders.order_date', [$from, $to])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('products.id, products.name, SUM(sales_order_items.quantity) as qty, SUM(sales_order_items.total) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        return $rows->map(fn ($row) => [
            'id' => $row->id,
            'name' => $row->name,
            'quantity' => round((float) $row->qty, 2),
            'revenue' => round((float) $row->revenue, 2),
        ])->all();
    }

    private function percentChange(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}