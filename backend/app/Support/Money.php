<?php

namespace App\Support;

final class Money
{
    public static function round(float|int|string|null $value, int $precision = 2): float
    {
        return round((float) $value, $precision);
    }

    public static function discountAmount(float $subtotal, string $type, float $value): float
    {
        return match ($type) {
            'percent' => round($subtotal * max(0, min($value, 100)) / 100, 2),
            'fixed' => round(min(max($value, 0), max($subtotal, 0)), 2),
            default => 0.0,
        };
    }

    public static function taxAmount(float $amount, float $rate): float
    {
        return round($amount * max($rate, 0) / 100, 2);
    }
}