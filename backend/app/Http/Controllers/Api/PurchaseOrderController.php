<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\PurchaseOrderResource;
use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\Request;

class PurchaseOrderController extends BaseApiController
{
    public function __construct(private readonly PurchaseOrderService $service) {}

    public function index(Request $request)
    {
        $query = PurchaseOrder::query()
            ->with(['supplier', 'user', 'warehouse'])
            ->withCount('items')
            ->status($request->query('status'))
            ->between($this->dateFrom($request, 'from'), $this->dateFrom($request, 'to'))
            ->when($request->filled('supplier_id'), fn ($q) => $q->where('supplier_id', $request->integer('supplier_id')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('warehouse_id', $request->integer('warehouse_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(function ($sub) use ($term) {
                    $sub->where('number', 'like', "%{$term}%")
                        ->orWhere('reference', 'like', "%{$term}%")
                        ->orWhereHas('supplier', fn ($s) => $s->search($term));
                });
            })
            ->orderByDesc('id');

        return PurchaseOrderResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'order_date' => ['nullable', 'date'],
            'expected_date' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'in:fixed,percent'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'shipping' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'reference' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', 'in:draft,ordered'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.description' => ['nullable', 'string'],
        ]);

        $order = $this->service->create($data, $request->user()->id);

        if (($data['status'] ?? 'draft') === 'ordered') {
            $this->service->place($order);
        }

        return PurchaseOrderResource::make(
            $order->load(['supplier', 'user', 'warehouse', 'items.product'])
        )->response()->setStatusCode(201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return PurchaseOrderResource::make(
            $purchaseOrder->load(['supplier', 'user', 'warehouse', 'items.product'])
        );
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $data = $request->validate([
            'supplier_id' => ['sometimes', 'exists:suppliers,id'],
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
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.description' => ['nullable', 'string'],
        ]);

        $order = $this->service->update($purchaseOrder, $data);

        return PurchaseOrderResource::make($order->load(['supplier', 'warehouse', 'items.product']));
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $this->service->delete($purchaseOrder);

        return $this->message('Purchase order deleted.');
    }

    public function place(PurchaseOrder $purchaseOrder)
    {
        $order = $this->service->place($purchaseOrder);

        return PurchaseOrderResource::make($order->load(['supplier', 'items.product']))
            ->additional(['message' => 'Purchase order placed.']);
    }

    /**
     * Receive goods: [{ item_id, quantity }]
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $order = $this->service->receive($purchaseOrder, $data['items'], $request->user()->id);

        return PurchaseOrderResource::make($order->load(['supplier', 'warehouse', 'items.product']))
            ->additional(['message' => 'Goods received and stock updated.']);
    }

    public function cancel(PurchaseOrder $purchaseOrder)
    {
        $order = $this->service->cancel($purchaseOrder);

        return PurchaseOrderResource::make($order->load(['supplier', 'items.product']))
            ->additional(['message' => 'Purchase order cancelled.']);
    }
}