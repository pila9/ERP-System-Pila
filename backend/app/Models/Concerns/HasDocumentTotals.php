<?php

namespace App\Models\Concerns;

use App\Support\Money;

/**
 * Shared behaviour for order/invoice style documents: money columns are always
 * recomputed from the line items so stored totals never drift.
 */
trait HasDocumentTotals
{
    public function recalculateTotals(): void
    {
        $subtotal = 0.0;
        $taxTotal = 0.0;

        foreach ($this->items()->get() as $item) {
            $item->recalculate();
            $item->saveQuietly();

            $subtotal += $item->subtotal;
            $taxTotal += $item->tax_amount;
        }

        $discountAmount = Money::discountAmount(
            $subtotal,
            $this->discount_type ?? 'fixed',
            (float) ($this->discount_value ?? 0)
        );

        $this->forceFill([
            'subtotal' => round($subtotal, 2),
            'discount_amount' => round($discountAmount, 2),
            'tax_total' => round($taxTotal, 2),
            'grand_total' => round($subtotal - $discountAmount + $taxTotal + (float) ($this->shipping ?? 0), 2),
        ])->saveQuietly();
    }

    public function getBalanceDueAttribute(): float
    {
        return round((float) $this->grand_total - (float) $this->paid_amount, 2);
    }

    public function getIsPaidAttribute(): bool
    {
        return (float) $this->paid_amount >= (float) $this->grand_total && (float) $this->grand_total > 0;
    }
}