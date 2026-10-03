<?php

namespace App\Models;

use App\Models\Concerns\HasDocumentTotals;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SalesOrder extends Model
{
    use HasDocumentTotals;

    public const STATUSES = ['draft', 'confirmed', 'invoiced', 'shipped', 'completed', 'cancelled'];

    protected $fillable = [
        'number',
        'customer_id',
        'user_id',
        'warehouse_id',
        'order_date',
        'expected_date',
        'status',
        'discount_type',
        'discount_value',
        'discount_amount',
        'subtotal',
        'tax_total',
        'shipping',
        'grand_total',
        'paid_amount',
        'notes',
        'terms',
        'reference',
        'confirmed_at',
        'shipped_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $appends = ['balance_due', 'is_paid'];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_date' => 'date',
            'discount_value' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'shipping' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'shipped_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
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
        return $this->hasMany(SalesOrderItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
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

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', ['draft', 'confirmed']);
    }

    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    public function canBeCancelled(): bool
    {
        return ! in_array($this->status, ['completed', 'cancelled'], true);
    }
}