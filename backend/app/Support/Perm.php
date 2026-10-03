<?php

namespace App\Support;

final class Perm
{
    public const VIEW = 'view';
    public const CREATE = 'create';
    public const UPDATE = 'update';
    public const DELETE = 'delete';
    public const MANAGE = 'manage';

    /** @var array<string,string> module => human label */
    public const MODULES = [
        'products' => 'Products',
        'categories' => 'Categories',
        'warehouses' => 'Warehouses',
        'stock' => 'Inventory / Stock',
        'customers' => 'Customers',
        'suppliers' => 'Suppliers',
        'sales' => 'Sales Orders',
        'invoices' => 'Invoices & Payments',
        'purchases' => 'Purchase Orders',
        'reports' => 'Reports',
        'users' => 'Users',
        'roles' => 'Roles',
    ];

    /** Extra actions that do not follow the CRUD pattern. */
    public const EXTRA = [
        'products' => ['import', 'export'],
        'stock' => ['adjust', 'transfer'],
        'sales' => ['confirm', 'ship', 'complete'],
        'invoices' => ['payment', 'send'],
        'purchases' => ['receive', 'approve'],
    ];

    /** @return array<int,string> */
    public static function all(): array
    {
        $list = [];

        foreach (self::MODULES as $module => $label) {
            $actions = [self::VIEW, self::CREATE, self::UPDATE, self::DELETE, self::MANAGE];

            if ($module === 'users' || $module === 'roles') {
                $actions = [self::MANAGE];
            }

            if ($module === 'reports') {
                $actions = [self::VIEW];
            }

            foreach (self::EXTRA[$module] ?? [] as $extra) {
                $actions[] = $extra;
            }

            sort($actions);

            foreach (array_unique($actions) as $action) {
                $list[] = $module.'.'.$action;
            }
        }

        sort($list);

        return $list;
    }

    /** @return array<string,array<int,string>> module => permissions */
    public static function grouped(): array
    {
        $grouped = [];

        foreach (self::all() as $permission) {
            [$module] = explode('.', $permission);
            $grouped[$module][] = $permission;
        }

        return $grouped;
    }

    public static function isValid(string $permission): bool
    {
        return in_array($permission, self::all(), true);
    }
}