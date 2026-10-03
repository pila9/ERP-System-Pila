<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    protected $fillable = ['code', 'name', 'address', 'city', 'country', 'phone', 'manager', 'is_default', 'is_active'];

    protected $casts = ['is_active' => 'boolean', 'is_default' => 'boolean'];

    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'stock_levels')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function totalStockValue(): float
    {
        return (float) $this->stockLevels()->get()->sum(
            fn (StockLevel $level) => $level->quantity * (float) $level->product?->cost_price
        );
    }
}