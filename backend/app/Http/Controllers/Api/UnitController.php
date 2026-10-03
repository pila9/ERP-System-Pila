<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\UnitResource;
use App\Models\Unit;
use App\Support\BusinessRuleException;
use Illuminate\Http\Request;

class UnitController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Unit::query()
            ->withCount('products')
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->query('search').'%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $like)->orWhere('abbreviation', 'like', $like));
            })
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $this->boolFromRequest($request, 'is_active')))
            ->orderBy('name');

        return UnitResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'abbreviation' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $unit = Unit::create($data);

        return UnitResource::make($unit->loadCount('products'))->response()->setStatusCode(201);
    }

    public function update(Request $request, Unit $unit)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'abbreviation' => ['sometimes', 'required', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $unit->fill($data)->save();

        return UnitResource::make($unit->loadCount('products'));
    }

    public function destroy(Unit $unit)
    {
        if ($unit->products()->exists()) {
            throw new BusinessRuleException('This unit is used by products and cannot be deleted.');
        }

        $unit->delete();

        return $this->message('Unit deleted.');
    }
}