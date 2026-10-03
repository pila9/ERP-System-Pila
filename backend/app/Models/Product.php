<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'code',
        'sku',
        'barcode',
        'name',
        'description',
        'category_id',
        'unit_id',
        'cost_price',
        'sale_price',
        'tax_rate',
        'track_inventory',
        'reorder_level',
        'reorder_quantity',
        'is_active',
    ];

    protected $appends = ['total_stock', 'stock_value', 'stock_status'];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'reorder_quantity' => 'decimal:2',
            'track_inventory' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function salesOrderItems(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
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
                ->orWhere('sku', 'like', $like)
                ->orWhere('code', 'like', $like)
                ->orWhere('barcode', 'like', $like);
        });
    }

    public function getTotalStockAttribute(): float
    {
        if (! $this->track_inventory) {
            return 0.0;
        }

        return (float) ($this->relationLoaded('stockLevels')
            ? $this->stockLevels->sum('quantity')
            : $this->stockLevels()->sum('quantity'));
    }

    public function getStockValueAttribute(): float
    {
        return round($this->total_stock * (float) $this->cost_price, 2);
    }

    public function getStockStatusAttribute(): string
    {
        if (! $this->track_inventory) {
            return 'not_tracked';
        }

        $stock = $this->total_stock;

        if ($stock <= 0) {
            return 'out_of_stock';
        }

        if ($stock <= (float) $this->reorder_level) {
            return 'low';
        }

        return 'in_stock';
    }

    public function isLowStock(): bool
    {
        return $this->stock_status === 'low' || $this->stock_status === 'out_of_stock';
    }
}