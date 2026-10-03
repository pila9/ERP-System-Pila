<?php

namespace App\Models;

use App\Models\Concerns\HasDocumentTotals;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Invoice extends Model
{
    use HasDocumentTotals;

    public const STATUSES = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];

    protected $fillable = [
        'number',
        'customer_id',
        'sales_order_id',
        'user_id',
        'invoice_date',
        'due_date',
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
        'sent_at',
        'paid_at',
        'cancelled_at',
    ];

    protected $appends = ['balance_due', 'is_paid'];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'discount_value' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'shipping' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'sent_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeOutstanding(Builder $query): Builder
    {
        return $query->whereIn('status', ['sent', 'partial', 'overdue']);
    }

    public function scopeBetween(Builder $query, ?string $from, ?string $to): Builder
    {
        return $query
            ->when($from, fn (Builder $q) => $q->whereDate('invoice_date', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('invoice_date', '<=', $to));
    }

    public function getDaysOverdueAttribute(): int
    {
        if ($this->status === 'paid' || ! $this->due_date) {
            return 0;
        }

        return (int) now()->startOfDay()->diffInDays($this->due_date->startOfDay(), false);
    }

    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Flag invoices that passed their due date without being paid.
     * Cheap lazy update so "overdue" stays accurate without a scheduler.
     */
    public static function refreshOverdueStatuses(): void
    {
        static::query()
            ->whereIn('status', ['sent', 'partial'])
            ->whereDate('due_date', '<', now()->toDateString())
            ->where('paid_amount', '<', DB::raw('grand_total'))
            ->update(['status' => 'overdue']);
    }

    /** Refresh status based on payments and due date. */
    public function syncStatus(): void
    {
        $grandTotal = (float) $this->grand_total;
        $paid = (float) $this->paid_amount;

        $status = match (true) {
            $this->status === 'cancelled' => 'cancelled',
            $this->status === 'draft' => 'draft',
            $grandTotal > 0 && $paid >= $grandTotal => 'paid',
            $paid > 0 => 'partial',
            $this->due_date && $this->due_date->isPast() => 'overdue',
            default => 'sent',
        };

        if ($status !== $this->status) {
            $this->forceFill(['status' => $status])->saveQuietly();
        }
    }
}