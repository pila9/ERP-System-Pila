<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function __construct(private readonly InventoryService $inventory) {}

    /**
     * Standalone invoice (no sales order).
     */
    public function create(array $data, ?int $userId = null): Invoice
    {
        return DB::transaction(function () use ($data, $userId) {
            $customer = \App\Models\Customer::query()->findOrFail($data['customer_id']);
            $invoiceDate = $data['invoice_date'] ?? now()->toDateString();

            $invoice = Invoice::create([
                'number' => NumberGenerator::generate('invoice'),
                'customer_id' => $customer->id,
                'sales_order_id' => $data['sales_order_id'] ?? null,
                'user_id' => $userId,
                'invoice_date' => $invoiceDate,
                'due_date' => $data['due_date'] ?? now()->addDays($customer->payment_terms_days ?: 30)->toDateString(),
                'status' => $data['status'] ?? 'draft',
                'discount_type' => $data['discount_type'] ?? 'fixed',
                'discount_value' => $data['discount_value'] ?? 0,
                'shipping' => $data['shipping'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
            ]);

            $rows = [];
            foreach ($data['items'] ?? [] as $line) {
                $product = \App\Models\Product::query()->find($line['product_id']);

                $rows[] = [
                    'invoice_id' => $invoice->id,
                    'product_id' => $line['product_id'] ?? null,
                    'description' => $line['description'] ?? $product?->name,
                    'quantity' => (float) ($line['quantity'] ?? 1),
                    'unit_price' => (float) ($line['unit_price'] ?? $product?->sale_price ?? 0),
                    'discount' => (float) ($line['discount'] ?? 0),
                    'tax_rate' => (float) ($line['tax_rate'] ?? $product?->tax_rate ?? 0),
                ];
            }

            if ($rows === []) {
                throw new BusinessRuleException('An invoice needs at least one line item.');
            }

            $invoice->items()->createMany($rows);
            $invoice->load('items');
            $invoice->recalculateTotals();

            if ($invoice->status !== 'draft') {
                $invoice->forceFill(['sent_at' => now()])->save();
            }

            return $invoice->refresh();
        });
    }

    /**
     * Generate an invoice from every not-yet-invoiced line of a sales order.
     */
    public function createFromSalesOrder(SalesOrder $order, ?int $userId = null): Invoice
    {
        if (in_array($order->status, ['draft', 'cancelled'], true)) {
            throw new BusinessRuleException(
                "A {$order->status} sales order cannot be invoiced."
            );
        }

        return DB::transaction(function () use ($order, $userId) {
            $customer = $order->customer;

            $invoice = Invoice::create([
                'number' => NumberGenerator::generate('invoice'),
                'customer_id' => $customer->id,
                'sales_order_id' => $order->id,
                'user_id' => $userId,
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays($customer->payment_terms_days ?: 30)->toDateString(),
                'status' => 'sent',
                'discount_type' => $order->discount_type,
                'discount_value' => $order->discount_value,
                'shipping' => $order->shipping,
                'terms' => $order->terms,
                'notes' => $order->notes,
                'sent_at' => now(),
            ]);

            $rows = [];

            foreach ($order->items()->with('product')->get() as $item) {
                $remaining = $item->remainingQuantity();

                if ($remaining <= 0.001) {
                    continue;
                }

                $rows[] = [
                    'invoice_id' => $invoice->id,
                    'product_id' => $item->product_id,
                    'sales_order_item_id' => $item->id,
                    'description' => $item->description,
                    'quantity' => $remaining,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->remainingQuantity() === (float) $item->quantity
                        ? $item->discount
                        : 0,
                    'tax_rate' => $item->tax_rate,
                ];

                $item->forceFill([
                    'fulfilled_quantity' => (float) $item->quantity,
                ])->saveQuietly();
            }

            if ($rows === []) {
                throw new BusinessRuleException(
                    'All lines of this sales order have already been invoiced.'
                );
            }

            $invoice->items()->createMany($rows);
            $invoice->load('items');
            $invoice->recalculateTotals();

            $order->forceFill(['status' => 'invoiced'])->save();

            return $invoice->refresh();
        });
    }

    public function recordPayment(Invoice $invoice, array $data, ?int $userId = null): Payment
    {
        if (in_array($invoice->status, ['draft', 'cancelled'], true)) {
            throw new BusinessRuleException("Payments cannot be recorded on a {$invoice->status} invoice.");
        }

        return DB::transaction(function () use ($invoice, $data, $userId) {
            $amount = round((float) $data['amount'], 2);
            $balance = round((float) $invoice->grand_total - (float) $invoice->paid_amount, 2);

            if ($amount <= 0) {
                throw new BusinessRuleException('Payment amount must be greater than zero.');
            }

            if ($amount - $balance > 0.005) {
                throw new BusinessRuleException(
                    "Payment exceeds the outstanding balance.",
                    ['amount' => "Outstanding balance: {$balance}."]
                );
            }

            $payment = Payment::create([
                'number' => NumberGenerator::generate('payment'),
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'user_id' => $userId,
                'amount' => $amount,
                'paid_at' => $data['paid_at'] ?? now(),
                'method' => $data['method'] ?? 'cash',
                'reference' => $data['reference'] ?? null,
                'note' => $data['note'] ?? null,
            ]);

            $invoice->forceFill([
                'paid_amount' => round((float) $invoice->paid_amount + $amount, 2),
            ])->saveQuietly();

            $invoice->refresh();

            if ($invoice->paid_amount >= $invoice->grand_total && ! $invoice->paid_at) {
                $invoice->forceFill(['paid_at' => now()])->saveQuietly();
            }

            $invoice->syncStatus();

            return $payment->refresh();
        });
    }

    public function send(Invoice $invoice): Invoice
    {
        if ($invoice->status !== 'draft') {
            throw new BusinessRuleException('Only draft invoices can be sent.');
        }

        $invoice->forceFill([
            'status' => 'sent',
            'sent_at' => now(),
        ])->save();

        $invoice->syncStatus();

        return $invoice->refresh();
    }

    public function cancel(Invoice $invoice, ?int $userId = null): Invoice
    {
        if ($invoice->status === 'cancelled') {
            throw new BusinessRuleException('This invoice is already cancelled.');
        }

        if ((float) $invoice->paid_amount > 0) {
            throw new BusinessRuleException('An invoice with recorded payments cannot be cancelled.');
        }

        return DB::transaction(function () use ($invoice, $userId) {
            // Return shipped goods to stock when the invoice came from a shipped order.
            $order = $invoice->salesOrder;

            if ($order && $order->status === 'shipped' && $order->warehouse) {
                foreach ($invoice->items()->with('product')->get() as $item) {
                    if ($item->product?->track_inventory) {
                        $this->inventory->apply(
                            $item->product,
                            $order->warehouse,
                            (float) $item->quantity,
                            StockMovement::TYPE_IN,
                            $userId,
                            [
                                'reference_type' => 'invoice',
                                'reference_id' => $invoice->id,
                                'note' => "Cancelled invoice {$invoice->number}",
                            ]
                        );
                    }
                }
            }

            $invoice->payments()->delete();

            $invoice->forceFill([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'paid_amount' => 0,
            ])->save();

            return $invoice->refresh();
        });
    }

    public function delete(Invoice $invoice): void
    {
        if ($invoice->status !== 'draft') {
            throw new BusinessRuleException('Only draft invoices can be deleted.');
        }

        DB::transaction(fn () => $invoice->delete());
    }
}