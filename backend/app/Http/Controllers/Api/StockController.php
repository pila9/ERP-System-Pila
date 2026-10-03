<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\StockLevelResource;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\InventoryService;
use App\Support\BusinessRuleException;
use Illuminate\Http\Request;

class StockController extends BaseApiController
{
    public function __construct(private readonly InventoryService $inventory) {}

    /**
     * Current stock on hand, per product and warehouse.
     */
    public function levels(Request $request)
    {
        $query = StockLevel::query()
            ->with(['product', 'warehouse'])
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('warehouse_id', $request->integer('warehouse_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->whereHas('product', fn ($p) => $p->search($term));
            })
            ->when($request->boolean('low_only'), fn ($q) => $q->whereHas('product', function ($p) {
                $p->whereColumn('stock_levels.quantity', '<=', 'products.reorder_level');
            }))
            ->orderByDesc('quantity');

        return StockLevelResource::collection($this->paginate($request, $query));
    }

    public function lowStock(Request $request)
    {
        $query = Product::query()
            ->with(['category', 'unit'])
            ->where('is_active', true)
            ->where('track_inventory', true)
            ->where(function ($q) {
                $q->whereHas('stockLevels', fn ($l) => $l->whereColumn('stock_levels.quantity', '<=', 'products.reorder_level'))
                    ->orWhereDoesntHave('stockLevels');
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('warehouse_id'), function ($q) use ($request) {
                $q->whereHas('stockLevels', fn ($l) => $l->where('warehouse_id', $request->integer('warehouse_id')));
            })
            ->search($request->query('search'))
            ->orderBy('name');

        $products = $this->paginate($request, $query);
        $products->getCollection()->loadCount('stockLevels');

        return \App\Http\Resources\ProductResource::collection($products);
    }

    public function movements(Request $request)
    {
        $query = StockMovement::query()
            ->with(['product', 'warehouse', 'toWarehouse', 'user'])
            ->type($request->query('type'))
            ->between($this->dateFrom($request, 'from'), $this->dateFrom($request, 'to'))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('warehouse_id', $request->integer('warehouse_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->whereHas('product', fn ($p) => $p->search($term));
            })
            ->orderByDesc('id');

        return StockMovementResource::collection($this->paginate($request, $query));
    }

    public function summary(Request $request)
    {
        $warehouseId = $request->integer('warehouse_id') ?: null;

        $rows = StockLevel::query()
            ->with('product')
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->get();

        return $this->ok([
            'total_skus' => Product::query()->where('is_active', true)->count(),
            'tracked_skus' => $rows->count(),
            'total_quantity' => round($rows->sum('quantity'), 2),
            'total_value' => round($rows->sum(fn ($l) => (float) $l->quantity * (float) $l->product?->cost_price), 2),
            'retail_value' => round($rows->sum(fn ($l) => (float) $l->quantity * (float) $l->product?->sale_price), 2),
            'low_stock_count' => $rows->filter(fn ($l) => $l->product?->isLowStock())->count(),
            'out_of_stock_count' => $rows->filter(fn ($l) => (float) $l->quantity <= 0)->count(),
            'reserved_quantity' => round($rows->sum('reserved_quantity'), 2),
        ]);
    }

    /**
     * Set the absolute quantity of a product in a warehouse (stock take).
     */
    public function adjust(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:190'],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);
        $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);

        if (! $product->track_inventory) {
            throw new BusinessRuleException("{$product->name} does not track inventory.");
        }

        $movement = $this->inventory->adjust(
            $product,
            $warehouse,
            (float) $data['quantity'],
            $request->user()->id,
            $data['note'] ?? null
        );

        return $this->ok(
            (new StockMovementResource($movement->load(['product', 'warehouse', 'user'])))->resolve($request),
            201
        );
    }

    /**
     * Move stock between two warehouses.
     */
    public function transfer(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'from_warehouse_id' => ['required', 'exists:warehouses,id'],
            'to_warehouse_id' => ['required', 'exists:warehouses,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'note' => ['nullable', 'string', 'max:190'],
        ]);

        $movements = $this->inventory->transfer(
            Product::query()->findOrFail($data['product_id']),
            Warehouse::query()->findOrFail($data['from_warehouse_id']),
            Warehouse::query()->findOrFail($data['to_warehouse_id']),
            (float) $data['quantity'],
            $request->user()->id,
            $data['note'] ?? null
        );

        return $this->ok([
            'out' => (new StockMovementResource($movements['out']->load(['product', 'warehouse'])))->resolve($request),
            'in' => (new StockMovementResource($movements['in']->load(['product', 'warehouse'])))->resolve($request),
        ], 201);
    }
}