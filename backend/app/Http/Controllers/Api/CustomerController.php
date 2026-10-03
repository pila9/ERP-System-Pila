<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Models\Invoice;
use App\Support\BusinessRuleException;
use App\Support\NumberGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Customer::query()
            ->select('customers.*')
            ->selectSub(
                Invoice::query()
                    ->selectRaw('COALESCE(SUM(invoices.grand_total - invoices.paid_amount), 0)')
                    ->whereColumn('invoices.customer_id', 'customers.id')
                    ->whereNotIn('invoices.status', ['draft', 'cancelled']),
                'outstanding_balance'
            )
            ->search($request->query('search'))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $this->boolFromRequest($request, 'is_active')))
            ->when($request->filled('city'), fn ($q) => $q->where('city', 'like', '%'.$request->query('city').'%'))
            ->when($request->filled('sort'), function ($q) use ($request) {
                $sortable = ['name', 'code', 'city', 'credit_limit', 'created_at', 'is_active'];
                $q->orderBy(
                    in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'name',
                    $request->query('direction') === 'desc' ? 'desc' : 'asc'
                );
            }, fn ($q) => $q->orderBy('name'));

        return CustomerResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['code'] = $data['code'] ?? NumberGenerator::generate('customer');

        $customer = Customer::create($data);

        return CustomerResource::make($customer)->response()->setStatusCode(201);
    }

    public function show(Customer $customer)
    {
        $customer->loadCount(['salesOrders', 'invoices']);

        return CustomerResource::make($customer->load('invoices:id,grand_total,paid_amount,status'));
    }

    public function update(Request $request, Customer $customer)
    {
        $customer->fill($this->validated($request, $customer))->save();

        return CustomerResource::make($customer->fresh());
    }

    public function destroy(Customer $customer)
    {
        if ($customer->salesOrders()->exists() || $customer->invoices()->exists()) {
            throw new BusinessRuleException(
                'This customer has transactions. Deactivate the customer instead of deleting.'
            );
        }

        DB::transaction(fn () => $customer->delete());

        return $this->message('Customer deleted.');
    }

    private function validated(Request $request, ?Customer $customer = null): array
    {
        return $request->validate([
            'code' => ['nullable', 'string', 'max:40', 'unique:customers,code,'.($customer?->id)],
            'name' => [$customer ? 'sometimes' : 'required', 'string', 'max:160'],
            'company' => ['nullable', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:40'],
            'tax_number' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string', 'max:190'],
            'city' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
            'country' => ['nullable', 'string', 'max:80'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}