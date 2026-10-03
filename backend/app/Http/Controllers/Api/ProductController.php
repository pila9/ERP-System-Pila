<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with(['category', 'unit'])
            ->search($request->query('search'))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->integer('unit_id')))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $this->boolFromRequest($request, 'is_active')))
            ->when($request->filled('stock_status'), function ($q) use ($request) {
                match ($request->query('stock_status')) {
                    'in_stock' => $q->whereHas('stockLevels', fn ($l) => $l->whereColumn('stock_levels.quantity', '>', 'products.reorder_level')),
                    'low' => $q->whereHas('stockLevels', fn ($l) => $l->whereColumn('stock_levels.quantity', '>', 0)->whereColumn('stock_levels.quantity', '<=', 'products.reorder_level')),
                    'out_of_stock' => $q->where(fn ($sub) => $sub->whereDoesntHave('stockLevels')->orWhereHas('stockLevels', fn ($l) => $l->where('quantity', '<=', 0))),
                    default => null,
                };
            })
            ->when($request->filled('sort'), function ($q) use ($request) {
                $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
                $sortable = ['name', 'code', 'sku', 'cost_price', 'sale_price', 'created_at', 'is_active'];

                $q->orderBy(in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'name', $direction);
            }, fn ($q) => $q->orderBy('name'));

        $products = $this->paginate($request, $query);

        $products->getCollection()->loadCount('stockLevels');

        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $product = DB::transaction(function () use ($data, $request) {
            $data['code'] = $data['code'] ?? NumberGenerator::generate('product');
            $data['tax_rate'] = $data['tax_rate'] ?? config('erp.default_tax_rate');

            $product = Product::create($data);

            // Optional opening stock
            if (! empty($request->input('opening_quantity')) && $product->track_inventory) {
                $warehouseId = $request->input('warehouse_id')
                    ?? \App\Models\Warehouse::query()->where('is_default', true)->value('id')
                    ?? \App\Models\Warehouse::query()->value('id');

                if ($warehouseId) {
                    app(\App\Services\InventoryService::class)->apply(
                        $product,
                        \App\Models\Warehouse::query()->findOrFail($warehouseId),
                        (float) $request->input('opening_quantity'),
                        \App\Models\StockMovement::TYPE_IN,
                        $request->user()->id,
                        [
                            'note' => 'Opening stock',
                            'unit_cost' => $product->cost_price,
                            'update_cost' => true,
                        ]
                    );
                }
            }

            return $product;
        });

        return ProductResource::make($product->load(['category', 'unit']))->response()->setStatusCode(201);
    }

    public function show(Product $product)
    {
        return ProductResource::make(
            $product->load(['category', 'unit'])->loadCount('stockLevels')
        );
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validated($request, $product);

        $product->fill($data)->save();

        return ProductResource::make($product->load(['category', 'unit'])->loadCount('stockLevels'));
    }

    public function destroy(Product $product)
    {
        if ($product->salesOrderItems()->exists() || $product->invoiceItems()->exists()) {
            throw new BusinessRuleException(
                'This product is used in existing documents and can only be deactivated, not deleted.'
            );
        }

        DB::transaction(function () use ($product) {
            $product->stockMovements()->delete();
            $product->stockLevels()->delete();
            $product->delete();
        });

        return $this->message('Product deleted.');
    }

    private function validated(Request $request, ?Product $product = null): array
    {
        $id = $product?->id;

        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:60', 'unique:products,code,'.$id],
            'sku' => ['nullable', 'string', 'max:60'],
            'barcode' => ['nullable', 'string', 'max:60'],
            'name' => [$product ? 'sometimes' : 'required', 'string', 'max:190'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'track_inventory' => ['nullable', 'boolean'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'reorder_quantity' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'opening_quantity' => ['nullable', 'numeric', 'min:0'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
        ]);

        foreach ($data as $key => $value) {
            if (in_array($key, ['opening_quantity', 'warehouse_id'], true)) {
                unset($data[$key]);
            }
        }

        return $data;
    }
}