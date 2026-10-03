<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\InvoiceService;
use App\Services\InventoryService;
use App\Services\PurchaseOrderService;
use App\Services\SalesOrderService;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function __construct(
        private readonly SalesOrderService $sales,
        private readonly InvoiceService $invoices,
        private readonly PurchaseOrderService $purchases,
        private readonly InventoryService $inventory,
    ) {}

    public function run(): void
    {
        if (SalesOrder::query()->exists()) {
            return;
        }

        $admin = \App\Models\User::query()->where('email', 'admin@erp.test')->first();
        $rep = \App\Models\User::query()->where('email', 'rep@erp.test')->first();
        $accountant = \App\Models\User::query()->where('email', 'accountant@erp.test')->first();
        $warehouseUser = \App\Models\User::query()->where('email', 'warehouse@erp.test')->first();

        $mainWarehouse = Warehouse::query()->where('is_default', true)->firstOrFail();
        $northWarehouse = Warehouse::query()->where('code', 'WH-NORTH')->first();

        $products = Product::query()->where('is_active', true)->get();
        $customers = Customer::query()->where('is_active', true)->get();
        $suppliers = Supplier::query()->where('is_active', true)->get();

        // ---------------- Purchase orders -> goods receipts (restock + cost update)
        foreach ($suppliers->take(3) as $supplier) {
            $lines = $products->random(4)->map(fn (Product $p) => [
                'product_id' => $p->id,
                'quantity' => 25,
                'unit_price' => round((float) $p->cost_price * 0.95, 2),
                'tax_rate' => 0,
            ])->all();

            $order = $this->purchases->create([
                'supplier_id' => $supplier->id,
                'warehouse_id' => $mainWarehouse->id,
                'order_date' => now()->subDays(45)->toDateString(),
                'expected_date' => now()->subDays(38)->toDateString(),
                'notes' => 'Quarterly restock',
                'items' => $lines,
            ], $warehouseUser?->id);

            $this->purchases->place($order);
            $this->purchases->receive($order, $order->items->map(fn ($item) => [
                'item_id' => $item->id,
                'quantity' => (float) $item->quantity,
            ])->all(), $warehouseUser?->id);
        }

        // One partially received purchase order
        $partialLines = $products->random(3)->map(fn (Product $p) => [
            'product_id' => $p->id,
            'quantity' => 60,
            'unit_price' => round((float) $p->cost_price * 0.98, 2),
            'tax_rate' => 0,
        ])->all();

        $partialPo = $this->purchases->create([
            'supplier_id' => $suppliers->first()->id,
            'warehouse_id' => $northWarehouse?->id ?? $mainWarehouse->id,
            'order_date' => now()->subDays(6)->toDateString(),
            'expected_date' => now()->addDays(4)->toDateString(),
            'notes' => 'Split delivery expected',
            'items' => $partialLines,
        ], $warehouseUser?->id);

        $this->purchases->place($partialPo);
        $this->purchases->receive($partialPo, [[
            'item_id' => $partialPo->items->first()->id,
            'quantity' => 20,
        ]], $warehouseUser?->id);

        // ---------------- Sales orders across the last 90 days
        $statuses = ['completed', 'completed', 'completed', 'shipped', 'invoiced', 'confirmed', 'draft', 'cancelled'];

        // Live availability for the main warehouse, decremented as orders consume stock,
        // so the generated history never tries to sell what is not there.
        $available = [];

        foreach ($products as $product) {
            $available[$product->id] = $this->inventory->availableQuantity($product, $mainWarehouse);
        }

        for ($i = 0; $i < 42; $i++) {
            $customer = $customers->random();
            $orderDate = now()->subDays(random_int(0, 89));
            $status = $statuses[$i % count($statuses)];

            $sellable = $products->filter(fn (Product $p) => ($available[$p->id] ?? 0) >= 1)->values();

            if ($sellable->isEmpty()) {
                break;
            }

            $lineCount = min(random_int(1, 5), $sellable->count());
            $lines = $sellable->random($lineCount)->map(function (Product $p) use (&$available, $mainWarehouse) {
                $quantity = min(random_int(1, 8), (int) floor($available[$p->id]));
                $available[$p->id] -= $quantity;

                return [
                    'product_id' => $p->id,
                    'warehouse_id' => $mainWarehouse->id,
                    'quantity' => $quantity,
                    'unit_price' => (float) $p->sale_price,
                    'discount' => random_int(0, 3) === 0 ? round((float) $p->sale_price, 2) : 0,
                    'tax_rate' => (float) $p->tax_rate,
                ];
            })->values()->all();

            $order = $this->sales->create([
                'customer_id' => $customer->id,
                'warehouse_id' => $mainWarehouse->id,
                'order_date' => $orderDate->toDateString(),
                'expected_date' => $orderDate->copy()->addDays(random_int(3, 21))->toDateString(),
                'shipping' => random_int(0, 2) === 0 ? 45.00 : 0,
                'discount_type' => random_int(0, 4) === 0 ? 'percent' : 'fixed',
                'discount_value' => random_int(0, 4) === 0 ? random_int(2, 8) : 0,
                'notes' => $i % 7 === 0 ? 'Priority customer - deliver before month end.' : null,
                'items' => $lines,
            ], $rep?->id ?? $admin?->id);

            if ($status === 'draft') {
                continue;
            }

            if ($status === 'cancelled') {
                $this->sales->cancel($order);
                continue;
            }

            $this->sales->confirm($order, $rep?->id);

            if ($status === 'confirmed') {
                continue;
            }

            $this->sales->ship($order, $warehouseUser?->id);

            if ($status === 'shipped') {
                continue;
            }

            $invoice = $this->invoices->createFromSalesOrder($order, $accountant?->id);

            if ($status === 'invoiced') {
                continue;
            }

            // Payment behaviour: paid, partially paid, or overdue
            $roll = $i % 4;

            if ($roll === 0) {
                $this->invoices->recordPayment($invoice, [
                    'amount' => (float) $invoice->grand_total,
                    'paid_at' => now()->subDays(random_int(0, 20)),
                    'method' => ['bank_transfer', 'card', 'cash'][$i % 3],
                    'reference' => 'TRX'.str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT),
                ], $accountant?->id);
            } elseif ($roll === 1) {
                $this->invoices->recordPayment($invoice, [
                    'amount' => round((float) $invoice->grand_total / 2, 2),
                    'paid_at' => now()->subDays(random_int(1, 25)),
                    'method' => 'bank_transfer',
                    'note' => 'First instalment',
                ], $accountant?->id);
            }

            $this->sales->complete($order);
        }

        // A few standalone invoices without a sales order
        foreach ($customers->random(3) as $customer) {
            $lines = $products->random(2)->map(fn (Product $p) => [
                'product_id' => $p->id,
                'description' => $p->name,
                'quantity' => random_int(1, 4),
                'unit_price' => (float) $p->sale_price,
                'tax_rate' => (float) $p->tax_rate,
            ])->all();

            $this->invoices->create([
                'customer_id' => $customer->id,
                'invoice_date' => now()->subDays(random_int(1, 40))->toDateString(),
                'due_date' => now()->addDays(15)->toDateString(),
                'status' => 'sent',
                'items' => $lines,
                'notes' => 'Ad-hoc service invoice',
            ], $accountant?->id);
        }

        // Recent payments for the dashboard feed
        Payment::query()->inRandomOrder()->take(4)->get()->each(function ($payment) {
            $payment->forceFill(['paid_at' => now()->subDays(random_int(0, 10))])->save();
        });
    }
}