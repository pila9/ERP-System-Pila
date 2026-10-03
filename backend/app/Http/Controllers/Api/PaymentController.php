<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Payment::query()
            ->with(['invoice', 'customer', 'user'])
            ->between($this->dateFrom($request, 'from'), $this->dateFrom($request, 'to'))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('invoice_id'), fn ($q) => $q->where('invoice_id', $request->integer('invoice_id')))
            ->when($request->filled('method'), fn ($q) => $q->where('method', $request->query('method')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(function ($sub) use ($term) {
                    $sub->where('number', 'like', "%{$term}%")
                        ->orWhere('reference', 'like', "%{$term}%")
                        ->orWhereHas('customer', fn ($c) => $c->search($term));
                });
            })
            ->orderByDesc('paid_at');

        return PaymentResource::collection($this->paginate($request, $query));
    }

    public function show(Payment $payment)
    {
        return PaymentResource::make($payment->load(['invoice.items', 'customer', 'user']));
    }

    public function destroy(Payment $payment)
    {
        DB::transaction(function () use ($payment) {
            $invoice = $payment->invoice;

            if ($invoice) {
                $invoice->forceFill([
                    'paid_amount' => max(0, round((float) $invoice->paid_amount - (float) $payment->amount, 2)),
                ])->saveQuietly();

                $invoice->refresh()->syncStatus();
            }

            $payment->delete();
        });

        return $this->message('Payment reversed and deleted.');
    }
}