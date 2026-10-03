<?php

namespace App\Services;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Support\Facades\DB;

class PurchaseOrderService
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function create(array $data, ?int $userId = null): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $userId) {
            $order = PurchaseOrder::create([
                'number' => NumberGenerator::generate('purchase_order'),
                'supplier_id' => $data['supplier_id'],
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

    public function update(PurchaseOrder $order, array $data): PurchaseOrder
    {
        if (! $order->isEditable()) {
            throw new BusinessRuleException(
                "Only draft purchase orders can be edited (current status: {$order->status})."
            );
        }

        return DB::transaction(function () use ($order, $data) {
            $order->fill([
                'supplier_id' => $data['supplier_id'] ?? $order->supplier_id,
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

    public function place(PurchaseOrder $order): PurchaseOrder
    {
        if ($order->status !== 'draft') {
            throw new BusinessRuleException("Only draft purchase orders can be placed (current status: {$order->status}).");
        }

        if ($order->items()->count() === 0) {
            throw new BusinessRuleException('Cannot place a purchase order without items.');
        }

        $order->forceFill([
            'status' => 'ordered',
            'ordered_at' => now(),
        ])->save();

        return $order->refresh();
    }

    /**
     * Receive (part of) a purchase order. Every received line creates an
     * inbound stock movement and updates the product's moving average cost.
     *
     * @param  array<int,array<string,mixed>>  $lines  [{item_id, quantity}]
     */
    public function receive(PurchaseOrder $order, array $lines, ?int $userId = null): PurchaseOrder
    {
        if (! $order->canBeReceived()) {
            throw new BusinessRuleException("A {$order->status} purchase order cannot receive goods.");
        }

        if ($lines === []) {
            throw new BusinessRuleException('Provide at least one line to receive.');
        }

        return DB::transaction(function () use ($order, $lines, $userId) {
            $warehouse = $order->warehouse ?? Warehouse::query()->where('is_active', true)->firstOrFail();

            foreach ($lines as $line) {
                $item = $order->items()->with('product')->find($line['item_id'] ?? 0);

                if (! $item) {
                    throw new BusinessRuleException('A receipt line does not belong to this purchase order.');
                }

                $quantity = round((float) ($line['quantity'] ?? 0), 3);

                if ($quantity <= 0) {
                    continue;
                }

                $remaining = $item->remainingQuantity();

                if ($quantity - $remaining > 0.001) {
                    throw new BusinessRuleException(
                        "Cannot receive more than ordered for {$item->product?->name}.",
                        ['quantity' => "Ordered {$item->quantity}, already received {$item->received_quantity}."]
                    );
                }

                $product = $item->product;

                $this->inventory->apply(
                    $product,
                    $warehouse,
                    $quantity,
                    StockMovement::TYPE_IN,
                    $userId,
                    [
                        'reference_type' => 'purchase_order',
                        'reference_id' => $order->id,
                        'note' => "Received on {$order->number}",
                        'unit_cost' => (float) $item->unit_price,
                        'update_cost' => true,
                    ]
                );

                $item->forceFill([
                    'received_quantity' => round((float) $item->received_quantity + $quantity, 3),
                ])->saveQuietly();
            }

            $order->load('items');

            $fullyReceived = $order->items->every(fn ($item) => $item->isFullyReceived());
            $anyReceived = $order->items->contains(fn ($item) => (float) $item->received_quantity > 0);

            $order->forceFill([
                'status' => $fullyReceived ? 'received' : ($anyReceived ? 'partial' : $order->status),
                'received_at' => $fullyReceived ? ($order->received_at ?: now()) : $order->received_at,
                'warehouse_id' => $order->warehouse_id ?: $warehouse->id,
            ])->save();

            return $order->refresh();
        });
    }

    public function cancel(PurchaseOrder $order): PurchaseOrder
    {
        if (! in_array($order->status, ['draft', 'ordered'], true)) {
            throw new BusinessRuleException("A {$order->status} purchase order cannot be cancelled.");
        }

        $order->forceFill([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ])->save();

        return $order->refresh();
    }

    public function delete(PurchaseOrder $order): void
    {
        if (! $order->isEditable()) {
            throw new BusinessRuleException("Only draft purchase orders can be deleted (current status: {$order->status}).");
        }

        DB::transaction(fn () => $order->delete());
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     */
    private function syncItems(PurchaseOrder $order, array $items): void
    {
        if ($items === []) {
            return;
        }

        $rows = [];
        $seen = [];

        foreach ($items as $line) {
            $product = Product::query()->findOrFail($line['product_id']);

            if (isset($seen[$product->id])) {
                throw new BusinessRuleException(
                    "Duplicate product line: {$product->name}",
                    ['items' => 'The same product cannot appear twice on one purchase order.']
                );
            }
            $seen[$product->id] = true;

            $quantity = (float) $line['quantity'];

            if ($quantity <= 0) {
                throw new BusinessRuleException('Quantity must be greater than zero.', ['items' => 'Check the order lines.']);
            }

            $rows[] = [
                'purchase_order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'received_quantity' => 0,
                'unit_price' => (float) ($line['unit_price'] ?? $product->cost_price),
                'unit_cost' => $product->cost_price,
                'discount' => (float) ($line['discount'] ?? 0),
                'tax_rate' => (float) ($line['tax_rate'] ?? 0),
                'description' => $line['description'] ?? $product->name,
            ];
        }

        $order->items()->createMany($rows);
        $order->load('items');
        $order->recalculateTotals();
    }
}