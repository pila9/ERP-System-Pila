<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'name' => $this->name,
            'description' => $this->description,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'code' => $this->category->code,
            ]),
            'unit_id' => $this->unit_id,
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
                'abbreviation' => $this->unit->abbreviation,
            ]),
            'cost_price' => (float) $this->cost_price,
            'sale_price' => (float) $this->sale_price,
            'tax_rate' => (float) $this->tax_rate,
            'track_inventory' => (bool) $this->track_inventory,
            'reorder_level' => (float) $this->reorder_level,
            'reorder_quantity' => (float) $this->reorder_quantity,
            'is_active' => (bool) $this->is_active,
            'total_stock' => (float) $this->total_stock,
            'stock_value' => (float) $this->stock_value,
            'stock_status' => $this->stock_status,
            'margin_percent' => $this->marginPercent(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function marginPercent(): ?float
    {
        $cost = (float) $this->cost_price;
        $sale = (float) $this->sale_price;

        if ($cost <= 0) {
            return null;
        }

        return round((($sale - $cost) / $cost) * 100, 2);
    }
}