<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\Warehouse;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Support\Facades\DB;

class SalesOrderService
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function create(array $data, ?int $userId = null): SalesOrder
    {
        return DB::transaction(function () use ($data, $userId) {
            $order = SalesOrder::create([
                'number' => NumberGenerator::generate('sales_order'),
                'customer_id' => $data['customer_id'],
                'user_id' => $userId,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'order_date' => $data['order_date'] ?? now()->toDateString(),
                'expected_date' => $data['expected_date'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'discount_type' => $data['discount_type'] ?? 'fixed',
                'discount_value' => $data['discount_value'] ?? 0,
                'shipping' => $data['shipping'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
                'reference' => $data['reference'] ?? null,
            ]);

            $this->syncItems($order, $data['items'] ?? []);

            return $order->refresh();
        });
    }

    public function update(SalesOrder $order, array $data): SalesOrder
    {
        if (! $order->isEditable()) {
            throw new BusinessRuleException(
                "Only draft orders can be edited (current status: {$order->status})."
            );
        }

        return DB::transaction(function () use ($order, $data) {
            $order->fill([
                'customer_id' => $data['customer_id'] ?? $order->customer_id,
                'warehouse_id' => array_key_exists('warehouse_id', $data) ? $data['warehouse_id'] : $order->warehouse_id,
                'order_date' => $data['order_date'] ?? $order->order_date,
                'expected_date' => array_key_exists('expected_date', $data) ? $data['expected_date'] : $order->expected_date,
                'discount_type' => $data['discount_type'] ?? $order->discount_type,
                'discount_value' => $data['discount_value'] ?? $order->discount_value,
                'shipping' => array_key_exists('shipping', $data) ? $data['shipping'] : $order->shipping,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $order->notes,
                'terms' => array_key_exists('terms', $data) ? $data['terms'] : $order->terms,
                'reference' => array_key_exists('reference', $data) ? $data['reference'] : $order->reference,
            ])->save();

            if (array_key_exists('items', $data)) {
                $order->items()->delete();
                $this->syncItems($order, $data['items']);
            }

            return $order->refresh();
        });
    }

    /**
     * draft -> confirmed. Reserves the ordered stock.
     */
    public function confirm(SalesOrder $order, ?int $userId = null): SalesOrder
    {
        if ($order->status !== 'draft') {
            throw new BusinessRuleException("Only draft orders can be confirmed (current status: {$order->status}).");
        }

        if ($order->items()->count() === 0) {
            throw new BusinessRuleException('Cannot confirm an order without items.');
        }

        return DB::transaction(function () use ($order, $userId) {
            $warehouse = $order->warehouse ?? Warehouse::query()->firstOrFail();

            foreach ($order->items()->with('product')->get() as $item) {
                if (! $item->product?->track_inventory) {
                    continue;
                }

                $itemWarehouse = $item->warehouse ?: $warehouse;
                $available = $this->inventory->availableQuantity($item->product, $itemWarehouse);

                if ($available < (float) $item->quantity) {
                    throw new BusinessRuleException(
                        "Not enough stock for {$item->product->name} in {$itemWarehouse->name}.",
                        ['items' => ["{$item->product->name}: available {$available}, ordered {$item->quantity}."]]
                    );
                }
            }

            foreach ($order->items()->with('product')->get() as $item) {
                if ($item->product?->track_inventory) {
                    $this->inventory->reserve($item->product, $item->warehouse ?: $warehouse, (float) $item->quantity);
                }
            }

            $order->forceFill([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'warehouse_id' => $order->warehouse_id ?: $warehouse->id,
            ])->save();

            return $order->refresh();
        });
    }

    /**
     * confirmed -> shipped. Consumes the reserved stock.
     */
    public function ship(SalesOrder $order, ?int $userId = null): SalesOrder
    {
        if ($order->status !== 'confirmed') {
            throw new BusinessRuleException("Only confirmed orders can be shipped (current status: {$order->status}).");
        }

        return DB::transaction(function () use ($order, $userId) {
            $warehouse = $this->resolveWarehouse($order);

            foreach ($order->items()->with('product')->get() as $item) {
                if (! $item->product?->track_inventory) {
                    continue;
                }

                $this->inventory->apply(
                    $item->product,
                    $item->warehouse ?: $warehouse,
                    (float) $item->quantity,
                    \App\Models\StockMovement::TYPE_OUT,
                    $userId,
                    [
                        'reference_type' => 'sales_order',
                        'reference_id' => $order->id,
                        'note' => "Shipped on {$order->number}",
                        'unit_cost' => $item->unit_cost ?: $item->product->cost_price,
                    ]
                );

                // release the reservation that was taken on confirm
                $this->inventory->release($item->product, $item->warehouse ?: $warehouse, (float) $item->quantity);
            }

            $order->forceFill([
                'status' => 'shipped',
                'shipped_at' => now(),
            ])->save();

            return $order->refresh();
        });
    }

    public function complete(SalesOrder $order): SalesOrder
    {
        if (! in_array($order->status, ['shipped', 'invoiced'], true)) {
            throw new BusinessRuleException(
                "Only shipped or invoiced orders can be completed (current status: {$order->status})."
            );
        }

        $order->forceFill([
            'status' => 'completed',
            'completed_at' => now(),
        ])->save();

        return $order->refresh();
    }

    public function cancel(SalesOrder $order): SalesOrder
    {
        if (! $order->canBeCancelled()) {
            throw new BusinessRuleException("A {$order->status} order cannot be cancelled.");
        }

        return DB::transaction(function () use ($order) {
            if ($order->status === 'confirmed') {
                $warehouse = $this->resolveWarehouse($order);

                foreach ($order->items()->with('product')->get() as $item) {
                    if ($item->product?->track_inventory) {
                        $this->inventory->release($item->product, $item->warehouse ?: $warehouse, (float) $item->quantity);
                    }
                }
            }

            $order->forceFill([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ])->save();

            return $order->refresh();
        });
    }

    public function delete(SalesOrder $order): void
    {
        if (! $order->isEditable()) {
            throw new BusinessRuleException("Only draft orders can be deleted (current status: {$order->status}).");
        }

        DB::transaction(fn () => $order->delete());
    }

    /**
     * Fall back to the default warehouse when the order has none assigned.
     */
    private function resolveWarehouse(SalesOrder $order): Warehouse
    {
        return $order->warehouse
            ?? Warehouse::query()->where('is_default', true)->first()
            ?? Warehouse::query()->where('is_active', true)->firstOrFail();
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     */
    private function syncItems(SalesOrder $order, array $items): void
    {
        if ($items === []) {
            return;
        }

        $rows = [];
        $seen = [];

        foreach ($items as $line) {
            $product = Product::query()->findOrFail($line['product_id']);
            $key = $product->id.'-'.($line['warehouse_id'] ?? $order->warehouse_id ?? 0);

            if (isset($seen[$key])) {
                throw new BusinessRuleException(
                    "Duplicate product line: {$product->name}",
                    ['items' => 'The same product and warehouse cannot appear twice on one order.']
                );
            }
            $seen[$key] = true;

            $quantity = (float) $line['quantity'];
            $unitPrice = (float) ($line['unit_price'] ?? $product->sale_price);
            $discount = (float) ($line['discount'] ?? 0);

            if ($quantity <= 0) {
                throw new BusinessRuleException('Quantity must be greater than zero.', ['items' => 'Check the order lines.']);
            }

            $rows[] = [
                'sales_order_id' => $order->id,
                'product_id' => $product->id,
                'warehouse_id' => $line['warehouse_id'] ?? $order->warehouse_id,
                'quantity' => $quantity,
                'fulfilled_quantity' => 0,
                'unit_price' => $unitPrice,
                'unit_cost' => $product->cost_price,
                'discount' => $discount,
                'tax_rate' => $line['tax_rate'] ?? $product->tax_rate,
                'description' => $line['description'] ?? $product->name,
            ];
        }

        $order->items()->createMany($rows);
        $order->load('items');
        $order->recalculateTotals();
    }
}