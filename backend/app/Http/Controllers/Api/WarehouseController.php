<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\WarehouseResource;
use App\Models\Warehouse;
use App\Support\BusinessRuleException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Warehouse::query()
            ->withCount('stockLevels')
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->query('search').'%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $like)->orWhere('code', 'like', $like)->orWhere('city', 'like', $like));
            })
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $this->boolFromRequest($request, 'is_active')))
            ->orderBy('name');

        $warehouses = $this->paginate($request, $query);

        $warehouses->getCollection()->each(function (Warehouse $warehouse) {
            $warehouse->total_quantity = (float) $warehouse->stockLevels()->sum('quantity');
            $warehouse->total_value = round(
                (float) $warehouse->stockLevels()
                    ->join('products', 'products.id', '=', 'stock_levels.product_id')
                    ->selectRaw('COALESCE(SUM(stock_levels.quantity * products.cost_price), 0) AS value')
                    ->value('value'),
                2
            );
        });

        return WarehouseResource::collection($warehouses);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:warehouses,code'],
            'name' => ['required', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:190'],
            'city' => ['nullable', 'string', 'max:80'],
            'country' => ['nullable', 'string', 'max:80'],
            'phone' => ['nullable', 'string', 'max:40'],
            'manager' => ['nullable', 'string', 'max:120'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $warehouse = DB::transaction(fn () => Warehouse::create($this->withDefaultFlag($data)));

        return WarehouseResource::make($warehouse)->response()->setStatusCode(201);
    }

    public function show(Warehouse $warehouse)
    {
        return WarehouseResource::make($warehouse->loadCount('stockLevels'));
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $data = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:30', 'unique:warehouses,code,'.$warehouse->id],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:190'],
            'city' => ['nullable', 'string', 'max:80'],
            'country' => ['nullable', 'string', 'max:80'],
            'phone' => ['nullable', 'string', 'max:40'],
            'manager' => ['nullable', 'string', 'max:120'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $warehouse->fill($this->withDefaultFlag($data))->save();

        return WarehouseResource::make($warehouse->loadCount('stockLevels'));
    }

    public function destroy(Warehouse $warehouse)
    {
        if ($warehouse->stockLevels()->where('quantity', '>', 0)->exists()) {
            throw new BusinessRuleException('This warehouse still holds stock. Empty it first or deactivate it.');
        }

        if ($warehouse->is_default) {
            throw new BusinessRuleException('The default warehouse cannot be deleted.');
        }

        DB::transaction(function () use ($warehouse) {
            $warehouse->stockMovements()->delete();
            $warehouse->stockLevels()->delete();
            $warehouse->delete();
        });

        return $this->message('Warehouse deleted.');
    }

    private function withDefaultFlag(array $data): array
    {
        if (! empty($data['is_default'])) {
            Warehouse::query()->where('id', '!=', $data['id'] ?? 0)->update(['is_default' => false]);
        }

        return $data;
    }
}