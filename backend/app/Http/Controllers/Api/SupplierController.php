<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Supplier::query()
            ->search($request->query('search'))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $this->boolFromRequest($request, 'is_active')))
            ->when($request->filled('sort'), function ($q) use ($request) {
                $sortable = ['name', 'code', 'city', 'created_at', 'is_active'];
                $q->orderBy(
                    in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'name',
                    $request->query('direction') === 'desc' ? 'desc' : 'asc'
                );
            }, fn ($q) => $q->orderBy('name'));

        return SupplierResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['code'] = $data['code'] ?? NumberGenerator::generate('supplier');

        $supplier = Supplier::create($data);

        return SupplierResource::make($supplier)->response()->setStatusCode(201);
    }

    public function show(Supplier $supplier)
    {
        return SupplierResource::make($supplier->loadCount('purchaseOrders'));
    }

    public function update(Request $request, Supplier $supplier)
    {
        $supplier->fill($this->validated($request, $supplier))->save();

        return SupplierResource::make($supplier->fresh());
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->purchaseOrders()->exists()) {
            throw new BusinessRuleException(
                'This supplier has purchase orders. Deactivate the supplier instead of deleting.'
            );
        }

        DB::transaction(fn () => $supplier->delete());

        return $this->message('Supplier deleted.');
    }

    private function validated(Request $request, ?Supplier $supplier = null): array
    {
        return $request->validate([
            'code' => ['nullable', 'string', 'max:40', 'unique:suppliers,code,'.($supplier?->id)],
            'name' => [$supplier ? 'sometimes' : 'required', 'string', 'max:160'],
            'company' => ['nullable', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:40'],
            'tax_number' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string', 'max:190'],
            'city' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
            'country' => ['nullable', 'string', 'max:80'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'bank_account' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}