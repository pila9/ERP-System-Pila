<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends BaseApiController
{
    /**
     * Sales KPIs + daily/monthly trend for a period.
     */
    public function salesSummary(Request $request)
    {
        [$from, $to] = $this->period($request);

        $base = fn () => SalesOrder::query()
            ->between($from, $to)
            ->whereNotIn('status', ['cancelled', 'draft']);

        $total = (float) (clone $base())->sum('grand_total');
        $count = (clone $base())->count();

        $cancelled = (float) SalesOrder::query()->between($from, $to)->where('status', 'cancelled')->sum('grand_total');

        $invoices = Invoice::query()->between($from, $to);
        $collected = (float) Payment::query()->between($from, $to)->sum('amount');

        $byStatus = SalesOrder::query()
            ->between($from, $to)
            ->selectRaw('status, COUNT(*) as order_count, COALESCE(SUM(grand_total), 0) as amount')
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->status,
                'count' => (int) $r->order_count,
                'amount' => round((float) $r->amount, 2),
            ]);

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'orders_count' => $count,
                'sales_total' => round($total, 2),
                'average_order_value' => $count > 0 ? round($total / $count, 2) : 0,
                'cancelled_total' => round($cancelled, 2),
                'invoiced_total' => round((float) $invoices->sum('grand_total'), 2),
                'collected_total' => round($collected, 2),
                'outstanding_total' => round(
                    (float) $invoices->sum('grand_total') - (float) $invoices->sum('paid_amount'),
                    2
                ),
            ],
            'by_status' => $byStatus,
            'trend' => $this->dailyTrend($from, $to),
            'by_customer' => $this->byCustomer($from, $to),
            'by_product' => $this->byProduct($from, $to),
        ]);
    }

    /**
     * Sales grouped by customer.
     */
    public function salesByCustomer(Request $request)
    {
        [$from, $to] = $this->period($request);

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'rows' => $this->byCustomer($from, $to, (int) $request->integer('limit', 50)),
        ]);
    }

    /**
     * Products ranked by revenue / quantity.
     */
    public function topProducts(Request $request)
    {
        [$from, $to] = $this->period($request);

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'rows' => $this->byProduct($from, $to, (int) $request->integer('limit', 50)),
        ]);
    }

    /**
     * Stock on hand valuation per product.
     */
    public function stockValuation(Request $request)
    {
        $rows = DB::table('stock_levels')
            ->join('products', 'products.id', '=', 'stock_levels.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->join('warehouses', 'warehouses.id', '=', 'stock_levels.warehouse_id')
            ->when($request->filled('category_id'), fn ($q) => $q->where('products.category_id', $request->integer('category_id')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('stock_levels.warehouse_id', $request->integer('warehouse_id')))
            ->when($request->boolean('low_only'), fn ($q) => $q->whereColumn('stock_levels.quantity', '<=', 'products.reorder_level'))
            ->selectRaw('
                products.id, products.code, products.name, products.cost_price, products.sale_price,
                products.reorder_level,
                categories.name as category,
                warehouses.name as warehouse,
                stock_levels.quantity,
                (stock_levels.quantity * products.cost_price) as cost_value,
                (stock_levels.quantity * products.sale_price) as retail_value
            ')
            ->orderBy('cost_value', 'desc')
            ->limit((int) $request->integer('limit', 500))
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'category' => $r->category,
                'warehouse' => $r->warehouse,
                'quantity' => round((float) $r->quantity, 2),
                'cost_price' => (float) $r->cost_price,
                'sale_price' => (float) $r->sale_price,
                'reorder_level' => (float) $r->reorder_level,
                'cost_value' => round((float) $r->cost_value, 2),
                'retail_value' => round((float) $r->retail_value, 2),
                'potential_profit' => round((float) $r->retail_value - (float) $r->cost_value, 2),
                'is_low' => (float) $r->quantity <= (float) $r->reorder_level,
            ]);

        return $this->ok([
            'totals' => [
                'lines' => $rows->count(),
                'quantity' => round($rows->sum('quantity'), 2),
                'cost_value' => round($rows->sum('cost_value'), 2),
                'retail_value' => round($rows->sum('retail_value'), 2),
                'potential_profit' => round($rows->sum('potential_profit'), 2),
            ],
            'rows' => $rows,
        ]);
    }

    /**
     * Products at or below their reorder level.
     */
    public function lowStock(Request $request)
    {
        $rows = Product::query()
            ->where('track_inventory', true)
            ->where('is_active', true)
            ->with('category')
            ->withCount('stockLevels')
            ->where(function ($q) {
                $q->whereHas('stockLevels', fn ($l) => $l->whereColumn('stock_levels.quantity', '<=', 'products.reorder_level'))
                    ->orWhereDoesntHave('stockLevels');
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'category' => $p->category?->name,
                'quantity' => (float) $p->total_stock,
                'reorder_level' => (float) $p->reorder_level,
                'reorder_quantity' => (float) $p->reorder_quantity,
                'status' => $p->stock_status,
                'estimated_cost' => round((float) $p->reorder_quantity * (float) $p->cost_price, 2),
            ]);

        return $this->ok([
            'totals' => [
                'count' => $rows->count(),
                'out_of_stock' => $rows->where('status', 'out_of_stock')->count(),
                'estimated_reorder_cost' => round($rows->sum('estimated_cost'), 2),
            ],
            'rows' => $rows,
        ]);
    }

    /**
     * Accounts receivable aging buckets.
     */
    public function receivables(Request $request)
    {
        Invoice::refreshOverdueStatuses();

        $invoices = Invoice::query()
            ->outstanding()
            ->with('customer')
            ->get()
            ->map(fn (Invoice $invoice) => [
                'invoice_id' => $invoice->id,
                'number' => $invoice->number,
                'customer' => $invoice->customer?->name,
                'customer_id' => $invoice->customer_id,
                'invoice_date' => $invoice->invoice_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'status' => $invoice->status,
                'grand_total' => (float) $invoice->grand_total,
                'paid_amount' => (float) $invoice->paid_amount,
                'balance_due' => (float) $invoice->balance_due,
                'days_overdue' => max(0, (int) $invoice->days_overdue),
                'bucket' => $this->bucket(max(0, (int) $invoice->days_overdue)),
            ]);

        $buckets = ['current' => 0, '1-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0];
        $customers = [];

        foreach ($invoices as $invoice) {
            $buckets[$invoice['bucket']] += $invoice['balance_due'];
            $customers[$invoice['customer_id']] = ($customers[$invoice['customer_id']] ?? 0) + $invoice['balance_due'];
        }

        $topDebtors = Customer::query()
            ->whereIn('id', array_keys($customers))
            ->get()
            ->map(fn (Customer $c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'balance' => round($customers[$c->id], 2),
                'credit_limit' => (float) $c->credit_limit,
            ])
            ->sortByDesc('balance')
            ->values()
            ->take(10);

        return $this->ok([
            'totals' => [
                'outstanding' => round($invoices->sum('balance_due'), 2),
                'overdue' => round($invoices->where('days_overdue', '>', 0)->sum('balance_due'), 2),
                'invoices_count' => $invoices->count(),
            ],
            'buckets' => collect($buckets)->map(fn ($v) => round($v, 2))->all(),
            'top_debtors' => $topDebtors,
            'rows' => $invoices->sortByDesc('balance_due')->values(),
        ]);
    }

    /**
     * Accounts payable summary by supplier.
     */
    public function payables(Request $request)
    {
        [$from, $to] = $this->period($request);

        $rows = DB::table('purchase_orders')
            ->join('suppliers', 'suppliers.id', '=', 'purchase_orders.supplier_id')
            ->whereBetween('purchase_orders.order_date', [$from, $to])
            ->whereNotIn('purchase_orders.status', ['draft', 'cancelled'])
            ->selectRaw('
                suppliers.id, suppliers.code, suppliers.name,
                COUNT(purchase_orders.id) as orders_count,
                COALESCE(SUM(purchase_orders.grand_total), 0) as total,
                COALESCE(SUM(purchase_orders.paid_amount), 0) as paid
            ')
            ->groupBy('suppliers.id', 'suppliers.code', 'suppliers.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'supplier_id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'orders_count' => (int) $r->orders_count,
                'total' => round((float) $r->total, 2),
                'paid' => round((float) $r->paid, 2),
                'balance' => round((float) $r->total - (float) $r->paid, 2),
            ]);

        $suppliers = Supplier::query()->count();

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'suppliers_count' => $suppliers,
                'purchases_total' => round($rows->sum('total'), 2),
                'balance' => round($rows->sum('balance'), 2),
            ],
            'rows' => $rows,
        ]);
    }

    /**
     * Inbound / outbound stock movement summary.
     */
    public function stockMovements(Request $request)
    {
        [$from, $to] = $this->period($request);

        $rows = DB::table('stock_movements')
            ->leftJoin('products', 'products.id', '=', 'stock_movements.product_id')
            ->whereBetween('stock_movements.created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->when($request->filled('product_id'), fn ($q) => $q->where('stock_movements.product_id', $request->integer('product_id')))
            ->selectRaw('stock_movements.type, COUNT(*) as movements, COALESCE(SUM(stock_movements.quantity), 0) as quantity, COALESCE(SUM(stock_movements.quantity * stock_movements.unit_cost), 0) as value')
            ->groupBy('stock_movements.type')
            ->get()
            ->map(fn ($r) => [
                'type' => $r->type,
                'movements' => (int) $r->movements,
                'quantity' => round((float) $r->quantity, 2),
                'value' => round((float) $r->value, 2),
            ]);

        $totals = StockLevel::query()->with('product')->get();

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'by_type' => $rows,
            'totals' => [
                'stock_value' => round($totals->sum(fn ($l) => (float) $l->quantity * (float) $l->product?->cost_price), 2),
                'stock_quantity' => round($totals->sum('quantity'), 2),
                'reserved_quantity' => round($totals->sum('reserved_quantity'), 2),
                'movements' => StockMovement::query()->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])->count(),
            ],
        ]);
    }

    /**
     * Profit estimate per sales order (revenue - cost of goods sold).
     */
    public function profitAndLoss(Request $request)
    {
        [$from, $to] = $this->period($request);

        $sales = (float) SalesOrder::query()->between($from, $to)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('grand_total');

        $discounts = (float) SalesOrder::query()->between($from, $to)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('discount_amount');

        $cogs = (float) DB::table('sales_order_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->whereBetween('sales_orders.order_date', [$from, $to])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('COALESCE(SUM(sales_order_items.quantity * sales_order_items.unit_cost), 0) AS cogs')
            ->value('cogs');

        $purchases = (float) PurchaseOrder::query()->between($from, $to)
            ->whereIn('status', ['received', 'partial'])
            ->sum('grand_total');

        $tax = (float) Invoice::query()->between($from, $to)->sum('tax_total');

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'lines' => [
                ['label' => 'Gross sales', 'amount' => round($sales + $discounts, 2), 'type' => 'income'],
                ['label' => 'Discounts granted', 'amount' => round(-$discounts, 2), 'type' => 'expense'],
                ['label' => 'Net sales (incl. tax)', 'amount' => round($sales, 2), 'type' => 'subtotal'],
                ['label' => 'Cost of goods sold', 'amount' => round(-$cogs, 2), 'type' => 'expense'],
                ['label' => 'Gross profit', 'amount' => round($sales - $cogs, 2), 'type' => 'subtotal'],
                ['label' => 'Goods purchased (received)', 'amount' => round($purchases, 2), 'type' => 'info'],
                ['label' => 'Tax collected', 'amount' => round($tax, 2), 'type' => 'info'],
            ],
            'totals' => [
                'net_sales' => round($sales, 2),
                'cogs' => round($cogs, 2),
                'gross_profit' => round($sales - $cogs, 2),
                'margin_percent' => $sales > 0 ? round((($sales - $cogs) / $sales) * 100, 1) : 0.0,
            ],
        ]);
    }

    private function bucket(int $days): string
    {
        return match (true) {
            $days <= 0 => 'current',
            $days <= 30 => '1-30',
            $days <= 60 => '31-60',
            $days <= 90 => '61-90',
            default => '90+',
        };
    }

    /**
     * @return array{0:string,1:string}
     */
    private function period(Request $request): array
    {
        $to = $this->dateFrom($request, 'to') ?? now()->toDateString();
        $from = $this->dateFrom($request, 'from') ?? now()->subDays(29)->toDateString();

        return [$from, $to];
    }

    private function dailyTrend(string $from, string $to): array
    {
        $days = min((int) now()->parse($from)->diffInDays(now()->parse($to)) + 1, 120);

        $sales = DB::table('sales_orders')
            ->selectRaw("DATE_FORMAT(order_date, '%Y-%m-%d') as day, COALESCE(SUM(grand_total), 0) as total, COUNT(*) as orders")
            ->whereBetween('order_date', [$from, $to])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $trend = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->parse($from)->addDays($i);
            $key = $date->toDateString();

            $trend[] = [
                'day' => $key,
                'label' => $date->format('M j'),
                'total' => round((float) ($sales[$key]->total ?? 0), 2),
                'orders' => (int) ($sales[$key]->orders ?? 0),
            ];
        }

        return $trend;
    }

    private function byCustomer(string $from, string $to, int $limit = 20): array
    {
        return DB::table('sales_orders')
            ->join('customers', 'customers.id', '=', 'sales_orders.customer_id')
            ->whereBetween('sales_orders.order_date', [$from, $to])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('
                customers.id, customers.code, customers.name,
                COUNT(sales_orders.id) as orders_count,
                COALESCE(SUM(sales_orders.grand_total), 0) as total
            ')
            ->groupBy('customers.id', 'customers.code', 'customers.name')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'customer_id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'orders_count' => (int) $r->orders_count,
                'total' => round((float) $r->total, 2),
                'average_order_value' => $r->orders_count > 0 ? round((float) $r->total / (int) $r->orders_count, 2) : 0,
            ])
            ->all();
    }

    private function byProduct(string $from, string $to, int $limit = 20): array
    {
        return DB::table('sales_order_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'products.id', '=', 'sales_order_items.product_id')
            ->whereBetween('sales_orders.order_date', [$from, $to])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('
                products.id, products.code, products.name, products.cost_price, products.sale_price,
                SUM(sales_order_items.quantity) as quantity,
                SUM(sales_order_items.total) as revenue,
                SUM(sales_order_items.quantity * sales_order_items.unit_cost) as cost
            ')
            ->groupBy('products.id', 'products.code', 'products.name', 'products.cost_price', 'products.sale_price')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'quantity' => round((float) $r->quantity, 2),
                'revenue' => round((float) $r->revenue, 2),
                'cost' => round((float) $r->cost, 2),
                'profit' => round((float) $r->revenue - (float) $r->cost, 2),
                'margin_percent' => (float) $r->revenue > 0
                    ? round((((float) $r->revenue - (float) $r->cost) / (float) $r->revenue) * 100, 1)
                    : 0.0,
            ])
            ->all();
    }
}