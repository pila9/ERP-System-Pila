<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesOrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'code' => $this->product->code,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'track_inventory' => (bool) $this->product->track_inventory,
            ] : null),
            'description' => $this->description ?? $this->product?->name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
            ] : null),
            'quantity' => (float) $this->quantity,
            'fulfilled_quantity' => (float) $this->fulfilled_quantity,
            'remaining_quantity' => $this->remainingQuantity(),
            'unit_price' => (float) $this->unit_price,
            'unit_cost' => (float) $this->unit_cost,
            'discount' => (float) $this->discount,
            'tax_rate' => (float) $this->tax_rate,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'total' => (float) $this->total,
        ];
    }
}