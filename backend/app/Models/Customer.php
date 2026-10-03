<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'code',
        'name',
        'company',
        'email',
        'phone',
        'tax_number',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'credit_limit',
        'payment_terms_days',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';

        return $query->where(function (Builder $q) use ($like) {
            $q->where('name', 'like', $like)
                ->orWhere('code', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('company', 'like', $like)
                ->orWhere('phone', 'like', $like);
        });
    }

    /** Total outstanding balance (invoices minus payments). */
    public function outstandingBalance(): float
    {
        $invoiced = (float) $this->invoices()->whereNotIn('status', ['draft', 'cancelled'])->sum('grand_total');
        $paid = (float) $this->invoices()->whereNotIn('status', ['draft', 'cancelled'])->sum('paid_amount');

        return round($invoiced - $paid, 2);
    }

    public function getOutstandingAttribute(): float
    {
        if ($this->relationLoaded('invoices')) {
            $relevant = $this->invoices->whereNotIn('status', ['draft', 'cancelled']);

            return round($relevant->sum('grand_total') - $relevant->sum('paid_amount'), 2);
        }

        return $this->outstandingBalance();
    }

    public function getBalanceAttribute(): float
    {
        return $this->outstanding;
    }
}