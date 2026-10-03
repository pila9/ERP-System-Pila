<?php

namespace App\Models;

use App\Support\Money;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'quantity',
        'received_quantity',
        'unit_price',
        'unit_cost',
        'discount',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'received_quantity' => 'decimal:3',
            'unit_price' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function recalculate(): void
    {
        $lineGross = (float) $this->quantity * (float) $this->unit_price;
        $subtotal = max(round($lineGross - (float) $this->discount, 2), 0);
        $tax = Money::taxAmount($subtotal, (float) $this->tax_rate);

        $this->forceFill([
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'total' => round($subtotal + $tax, 2),
        ]);
    }

    public function remainingQuantity(): float
    {
        return round((float) $this->quantity - (float) $this->received_quantity, 3);
    }

    public function isFullyReceived(): bool
    {
        return $this->remainingQuantity() <= 0.001;
    }
}