<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'company' => $this->company,
            'email' => $this->email,
            'phone' => $this->phone,
            'tax_number' => $this->tax_number,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'credit_limit' => (float) $this->credit_limit,
            'payment_terms_days' => (int) $this->payment_terms_days,
            'notes' => $this->notes,
            'is_active' => (bool) $this->is_active,
            'balance' => (float) ($this->outstanding_balance ?? $this->balance),
            'sales_orders_count' => $this->whenCounted('salesOrders'),
            'invoices_count' => $this->whenCounted('invoices'),
            'total_invoiced' => $this->when(isset($this->total_invoiced), (float) $this->total_invoiced),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}