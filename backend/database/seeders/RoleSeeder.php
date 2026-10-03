<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Support\Perm;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $all = Perm::all();

        $roles = [
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Full access to every module and setting.',
                'permissions' => ['*'],
            ],
            [
                'name' => 'General Manager',
                'slug' => 'manager',
                'description' => 'Runs day-to-day operations. Cannot manage users or roles.',
                'permissions' => array_values(array_filter($all, fn ($p) => ! in_array($p, ['users.manage', 'roles.manage'], true))),
            ],
            [
                'name' => 'Sales Manager',
                'slug' => 'sales_manager',
                'description' => 'Owns customers, quotes, sales orders and invoices.',
                'permissions' => [
                    'products.view', 'categories.view', 'stock.view',
                    'customers.*', 'sales.*', 'invoices.*',
                    'reports.view', 'reports.sales-summary',
                ],
            ],
            [
                'name' => 'Sales Representative',
                'slug' => 'sales_rep',
                'description' => 'Creates and follows up on sales orders for assigned customers.',
                'permissions' => [
                    'products.view', 'categories.view',
                    'customers.view', 'customers.create', 'customers.update',
                    'sales.view', 'sales.create', 'sales.update', 'sales.confirm',
                    'invoices.view', 'invoices.create',
                ],
            ],
            [
                'name' => 'Warehouse / Inventory',
                'slug' => 'warehouse',
                'description' => 'Manages warehouses, stock levels, receipts and deliveries.',
                'permissions' => [
                    'products.view', 'warehouses.*',
                    'stock.*', 'purchases.view', 'purchases.receive',
                    'sales.view', 'reports.view',
                ],
            ],
            [
                'name' => 'Accountant',
                'slug' => 'accountant',
                'description' => 'Invoicing, payments, ledgers and financial reports.',
                'permissions' => [
                    'products.view', 'customers.view', 'suppliers.view',
                    'sales.view', 'invoices.*', 'purchases.view', 'stock.view',
                    'reports.*',
                ],
            ],
            [
                'name' => 'Viewer / Auditor',
                'slug' => 'viewer',
                'description' => 'Read-only access to all operational data and reports.',
                'permissions' => array_values(array_filter($all, fn ($p) => str_ends_with($p, '.view'))),
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                [
                    'name' => $role['name'],
                    'description' => $role['description'],
                    'permissions' => $role['permissions'],
                    'is_system' => true,
                ]
            );
        }
    }
}