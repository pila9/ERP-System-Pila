<?php

namespace App\Models;

use App\Models\Concerns\HasDocumentTotals;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasDocumentTotals;

    public const STATUSES = ['draft', 'ordered', 'partial', 'received', 'cancelled'];

    protected $fillable = [
        'number',
        'supplier_id',
        'user_id',
        'warehouse_id',
        'order_date',
        'expected_date',
        'received_at',
        'status',
        'discount_type',
        'discount_value',
        'discount_amount',
        'subtotal',
        'tax_total',
        'shipping',
        'grand_total',
        'notes',
        'terms',
        'reference',
        'ordered_at',
        'cancelled_at',
    ];

    protected $appends = ['balance_due', 'is_paid'];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_date' => 'date',
            'received_at' => 'datetime',
            'ordered_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'discount_value' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'shipping' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeBetween(Builder $query, ?string $from, ?string $to): Builder
    {
        return $query
            ->when($from, fn (Builder $q) => $q->whereDate('order_date', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('order_date', '<=', $to));
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft'], true);
    }

    public function canBeReceived(): bool
    {
        return in_array($this->status, ['draft', 'ordered', 'partial'], true);
    }
}