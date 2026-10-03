<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockLevelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->relationLoaded('product') ? $this->product : null;
        $warehouse = $this->relationLoaded('warehouse') ? $this->warehouse : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product' => $product ? [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
                'sku' => $product->sku,
                'cost_price' => (float) $product->cost_price,
                'sale_price' => (float) $product->sale_price,
                'reorder_level' => (float) $product->reorder_level,
                'track_inventory' => (bool) $product->track_inventory,
            ] : null,
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => $warehouse ? [
                'id' => $warehouse->id,
                'code' => $warehouse->code,
                'name' => $warehouse->name,
            ] : null,
            'quantity' => (float) $this->quantity,
            'reserved_quantity' => (float) $this->reserved_quantity,
            'available_quantity' => $this->available(),
            'value' => round((float) $this->quantity * (float) ($product->cost_price ?? 0), 2),
            'is_low' => $product ? $product->isLowStock() : false,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}