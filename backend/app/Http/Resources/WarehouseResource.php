<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'address' => $this->address,
            'city' => $this->city,
            'country' => $this->country,
            'phone' => $this->phone,
            'manager' => $this->manager,
            'is_default' => (bool) $this->is_default,
            'is_active' => (bool) $this->is_active,
            'total_quantity' => (float) ($this->total_quantity ?? 0),
            'total_value' => (float) ($this->total_value ?? 0),
            'products_count' => $this->whenCounted('stockLevels'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}