<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Apply a signed quantity change to a product/warehouse and write the audit movement.
     *
     * @param  float  $quantity  always positive; direction comes from $type
     * @param  array<string,mixed>  $meta  reference_type, reference_id, note, unit_cost
     */
    public function apply(
        Product $product,
        Warehouse $warehouse,
        float $quantity,
        string $type,
        int $userId,
        array $meta = []
    ): StockMovement {
        return DB::transaction(function () use ($product, $warehouse, $quantity, $type, $userId, $meta) {
            $level = StockLevel::query()
                ->where('product_id', $product->id)
                ->where('warehouse_id', $warehouse->id)
                ->lockForUpdate()
                ->first();

            if (! $level) {
                $level = StockLevel::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                ]);
            }

            $current = (float) $level->quantity;
            $delta = in_array($type, [StockMovement::TYPE_OUT, StockMovement::TYPE_TRANSFER_OUT], true)
                ? -abs($quantity)
                : abs($quantity);

            $newQuantity = round($current + $delta, 3);

            if ($newQuantity < 0 && ! config('erp.negative_stock_allowed')) {
                throw new BusinessRuleException(
                    "Insufficient stock for {$product->name} in {$warehouse->name}.",
                    ['stock' => "Available: {$current}, requested: ".abs($quantity).'.']
                );
            }

            $level->forceFill(['quantity' => $newQuantity])->save();

            if (! empty($meta['update_cost']) && $delta > 0) {
                $product->forceFill(['cost_price' => $this->movingAverageCost(
                    $current,
                    (float) $product->cost_price,
                    (float) ($meta['unit_cost'] ?? $product->cost_price),
                    $delta,
                )])->save();
            }

            return StockMovement::create([
                'number' => NumberGenerator::generate('stock_movement'),
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'to_warehouse_id' => $meta['to_warehouse_id'] ?? null,
                'type' => $type,
                'quantity' => abs($delta),
                'unit_cost' => $meta['unit_cost'] ?? $product->cost_price,
                'balance_after' => $newQuantity,
                'reference_type' => $meta['reference_type'] ?? null,
                'reference_id' => $meta['reference_id'] ?? null,
                'note' => $meta['note'] ?? null,
                'user_id' => $userId,
            ]);
        });
    }

    /**
     * Set the absolute quantity of a product in a warehouse (stock take / correction).
     */
    public function adjust(Product $product, Warehouse $warehouse, float $newQuantity, int $userId, ?string $note = null): StockMovement
    {
        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $current = (float) ($level->quantity ?? 0);
        $delta = round($newQuantity - $current, 3);

        if ($delta === 0.0) {
            throw new BusinessRuleException('No change: the given quantity already matches the current stock.');
        }

        $type = $delta > 0 ? StockMovement::TYPE_IN : StockMovement::TYPE_OUT;

        return $this->apply($product, $warehouse, $delta, $type, $userId, [
            'note' => $note ?: 'Manual stock adjustment',
            'unit_cost' => $product->cost_price,
        ]);
    }

    /**
     * Move stock between two warehouses (two movements, one for each side).
     */
    public function transfer(
        Product $product,
        Warehouse $from,
        Warehouse $to,
        float $quantity,
        int $userId,
        ?string $note = null
    ): array {
        if ($from->id === $to->id) {
            throw new BusinessRuleException('Source and destination warehouses must be different.');
        }

        return DB::transaction(function () use ($product, $from, $to, $quantity, $userId, $note) {
            $out = $this->apply($product, $from, $quantity, StockMovement::TYPE_TRANSFER_OUT, $userId, [
                'to_warehouse_id' => $to->id,
                'note' => $note ?: "Transfer to {$to->name}",
            ]);

            $in = $this->apply($product, $to, $quantity, StockMovement::TYPE_TRANSFER_IN, $userId, [
                'to_warehouse_id' => $from->id,
                'note' => $note ?: "Transfer from {$from->name}",
            ]);

            return ['out' => $out, 'in' => $in];
        });
    }

    public function reserve(Product $product, Warehouse $warehouse, float $quantity): void
    {
        $level = StockLevel::query()->firstOrCreate(
            ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );

        $level->increment('reserved_quantity', abs($quantity));
    }

    public function release(Product $product, Warehouse $warehouse, float $quantity): void
    {
        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        if ($level) {
            $level->decrement('reserved_quantity', abs($quantity));
        }
    }

    public function availableQuantity(Product $product, Warehouse $warehouse): float
    {
        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        if (! $level) {
            return 0.0;
        }

        return round((float) $level->quantity - (float) $level->reserved_quantity, 3);
    }

    /**
     * Weighted moving average cost after a goods receipt.
     */
    private function movingAverageCost(
        float $currentQty,
        float $currentCost,
        float $unitCost,
        float $receivedQty
    ): float {
        $newQty = $currentQty + $receivedQty;

        if ($newQty <= 0) {
            return round($unitCost, 2);
        }

        return round((($currentQty * $currentCost) + ($receivedQty * $unitCost)) / $newQty, 2);
    }
}