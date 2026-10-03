<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\SalesOrder;
use App\Services\InvoiceService;
use Illuminate\Http\Request;

class InvoiceController extends BaseApiController
{
    public function __construct(private readonly InvoiceService $service) {}

    public function index(Request $request)
    {
        Invoice::refreshOverdueStatuses();

        $query = Invoice::query()
            ->with(['customer', 'user', 'salesOrder'])
            ->withCount('items')
            ->status($request->query('status'))
            ->between($this->dateFrom($request, 'from'), $this->dateFrom($request, 'to'))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('sales_order_id'), fn ($q) => $q->where('sales_order_id', $request->integer('sales_order_id')))
            ->when($request->filled('outstanding'), fn ($q) => $q->outstanding())
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(function ($sub) use ($term) {
                    $sub->where('number', 'like', "%{$term}%")
                        ->orWhereHas('customer', fn ($c) => $c->search($term));
                });
            })
            ->orderByDesc('id');

        return InvoiceResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'sales_order_id' => ['nullable', 'exists:sales_orders,id'],
            'invoice_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'in:fixed,percent'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'shipping' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,sent'],
            'items' => ['required_without:sales_order_id', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.description' => ['nullable', 'string', 'max:190'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        if (! empty($data['sales_order_id'])) {
            $order = SalesOrder::query()->findOrFail($data['sales_order_id']);
            $invoice = $this->service->createFromSalesOrder($order, $request->user()->id);
        } else {
            $invoice = $this->service->create($data, $request->user()->id);
        }

        return InvoiceResource::make(
            $invoice->load(['customer', 'user', 'salesOrder', 'items.product'])
        )->response()->setStatusCode(201);
    }

    public function show(Invoice $invoice)
    {
        Invoice::refreshOverdueStatuses();
        $invoice->refresh();

        return InvoiceResource::make(
            $invoice->load(['customer', 'user', 'salesOrder', 'items.product', 'payments'])
        );
    }

    public function update(Request $request, Invoice $invoice)
    {
        if (! $invoice->isEditable()) {
            abort(422, "Only draft invoices can be edited (current status: {$invoice->status}).");
        }

        $data = $request->validate([
            'customer_id' => ['sometimes', 'exists:customers,id'],
            'invoice_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'in:fixed,percent'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'shipping' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.description' => ['nullable', 'string', 'max:190'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $invoice->fill(collect($data)->only([
            'customer_id', 'invoice_date', 'due_date', 'discount_type',
            'discount_value', 'shipping', 'notes', 'terms',
        ])->all())->save();

        if (array_key_exists('items', $data)) {
            $invoice->items()->delete();
            $invoice->items()->createMany(collect($data['items'])->map(fn ($line) => [
                'product_id' => $line['product_id'] ?? null,
                'description' => $line['description'] ?? null,
                'quantity' => (float) $line['quantity'],
                'unit_price' => (float) $line['unit_price'],
                'discount' => (float) ($line['discount'] ?? 0),
                'tax_rate' => (float) ($line['tax_rate'] ?? 0),
            ])->all());
        }

        $invoice->load('items');
        $invoice->recalculateTotals();

        return InvoiceResource::make($invoice->load(['customer', 'items.product'])->refresh());
    }

    public function destroy(Invoice $invoice)
    {
        $this->service->delete($invoice);

        return $this->message('Invoice deleted.');
    }

    public function send(Invoice $invoice)
    {
        $invoice = $this->service->send($invoice);

        return InvoiceResource::make($invoice)->additional(['message' => 'Invoice sent.']);
    }

    public function cancel(Invoice $invoice)
    {
        $invoice = $this->service->cancel($invoice, request()->user()->id);

        return InvoiceResource::make($invoice->load('items'))->additional(['message' => 'Invoice cancelled.']);
    }

    /**
     * Build an invoice from a sales order (all un-invoiced lines).
     */
    public function fromOrder(Request $request, SalesOrder $salesOrder)
    {
        $invoice = $this->service->createFromSalesOrder($salesOrder, $request->user()->id);

        return InvoiceResource::make(
            $invoice->load(['customer', 'salesOrder', 'items.product'])
        )->response()->setStatusCode(201);
    }

    public function addPayment(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'paid_at' => ['nullable', 'date'],
            'method' => ['required', 'in:cash,bank_transfer,card,cheque,credit,other'],
            'reference' => ['nullable', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:190'],
        ]);

        $payment = $this->service->recordPayment($invoice, $data, $request->user()->id);

        return PaymentResource::make($payment->load(['customer', 'invoice']))
            ->response()->setStatusCode(201);
    }

    /**
     * Data needed to render a printable invoice document.
     */
    public function print(Invoice $invoice)
    {
        Invoice::refreshOverdueStatuses();
        $invoice->refresh();

        $invoice->load(['customer', 'salesOrder', 'items.product', 'payments', 'user']);

        return $this->ok([
            'invoice' => (new InvoiceResource($invoice))->resolve(request()),
            'company' => [
                'name' => config('app.name'),
                'currency' => config('erp.currency'),
                'symbol' => config('erp.currency_symbol'),
            ],
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}