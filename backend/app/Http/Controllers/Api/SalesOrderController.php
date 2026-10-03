<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\SalesOrderResource;
use App\Models\SalesOrder;
use App\Services\SalesOrderService;
use Illuminate\Http\Request;

class SalesOrderController extends BaseApiController
{
    public function __construct(private readonly SalesOrderService $service) {}

    public function index(Request $request)
    {
        $query = SalesOrder::query()
            ->with(['customer', 'user', 'warehouse'])
            ->withCount('items')
            ->status($request->query('status'))
            ->between($this->dateFrom($request, 'from'), $this->dateFrom($request, 'to'))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('warehouse_id', $request->integer('warehouse_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(function ($sub) use ($term) {
                    $sub->where('number', 'like', "%{$term}%")
                        ->orWhere('reference', 'like', "%{$term}%")
                        ->orWhereHas('customer', fn ($c) => $c->search($term));
                });
            })
            ->when($request->filled('min_total'), fn ($q) => $q->where('grand_total', '>=', (float) $request->query('min_total')))
            ->when($request->filled('max_total'), fn ($q) => $q->where('grand_total', '<=', (float) $request->query('max_total')))
            ->orderByDesc('id');

        return SalesOrderResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'order_date' => ['nullable', 'date'],
            'expected_date' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'in:fixed,percent'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'shipping' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'reference' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', 'in:draft,confirmed'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.description' => ['nullable', 'string'],
        ]);

        $order = $this->service->create($data, $request->user()->id);

        if (($data['status'] ?? 'draft') === 'confirmed') {
            $this->service->confirm($order, $request->user()->id);
        }

        return SalesOrderResource::make(
            $order->load(['customer', 'user', 'warehouse', 'items.product'])
        )->response()->setStatusCode(201);
    }

    public function show(SalesOrder $salesOrder)
    {
        return SalesOrderResource::make(
            $salesOrder->load(['customer', 'user', 'warehouse', 'items.product', 'invoice'])
        );
    }

    public function update(Request $request, SalesOrder $salesOrder)
    {
        $data = $request->validate([
            'customer_id' => ['sometimes', 'exists:customers,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'order_date' => ['nullable', 'date'],
            'expected_date' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'in:fixed,percent'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'shipping' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'reference' => ['nullable', 'string', 'max:80'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['required_with:items', 'exists:products,id'],
            'items.*.warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.description' => ['nullable', 'string'],
        ]);

        $order = $this->service->update($salesOrder, $data);

        return SalesOrderResource::make($order->load(['customer', 'user', 'warehouse', 'items.product']));
    }

    public function destroy(SalesOrder $salesOrder)
    {
        $this->service->delete($salesOrder);

        return $this->message('Sales order deleted.');
    }

    public function confirm(Request $request, SalesOrder $salesOrder)
    {
        $order = $this->service->confirm($salesOrder, $request->user()->id);

        return SalesOrderResource::make($order->load(['customer', 'warehouse', 'items.product']))
            ->additional(['message' => 'Sales order confirmed and stock reserved.']);
    }

    public function ship(Request $request, SalesOrder $salesOrder)
    {
        $order = $this->service->ship($salesOrder, $request->user()->id);

        return SalesOrderResource::make($order->load(['customer', 'warehouse', 'items.product']))
            ->additional(['message' => 'Sales order shipped. Stock has been deducted.']);
    }

    public function complete(SalesOrder $salesOrder)
    {
        $order = $this->service->complete($salesOrder);

        return SalesOrderResource::make($order->load(['customer', 'items.product']))
            ->additional(['message' => 'Sales order completed.']);
    }

    public function cancel(SalesOrder $salesOrder)
    {
        $order = $this->service->cancel($salesOrder);

        return SalesOrderResource::make($order->load(['customer', 'items.product']))
            ->additional(['message' => 'Sales order cancelled.']);
    }
}