<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Currency & formatting
    |--------------------------------------------------------------------------
    */

    'currency' => env('ERP_CURRENCY', 'USD'),
    'currency_symbol' => env('ERP_CURRENCY_SYMBOL', '$'),

    /*
    |--------------------------------------------------------------------------
    | Tax
    |--------------------------------------------------------------------------
    */

    'default_tax_rate' => (float) env('ERP_TAX_RATE', 10),

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    'default_warehouse_id' => env('ERP_DEFAULT_WAREHOUSE', 1),
    'negative_stock_allowed' => env('ERP_NEGATIVE_STOCK', false),
    'low_stock_alert' => env('ERP_LOW_STOCK_ALERT', true),

    /*
    |--------------------------------------------------------------------------
    | Document numbering
    |--------------------------------------------------------------------------
    | prefix + zero padded sequence, e.g. SO-2026-0001
    */

    'sequences' => [
        'product' => ['prefix' => 'PRD', 'padding' => 5],
        'customer' => ['prefix' => 'CUS', 'padding' => 4],
        'supplier' => ['prefix' => 'SUP', 'padding' => 4],
        'warehouse' => ['prefix' => 'WH', 'padding' => 3],
        'category' => ['prefix' => 'CAT', 'padding' => 4],
        'sales_order' => ['prefix' => 'SO', 'padding' => 4],
        'invoice' => ['prefix' => 'INV', 'padding' => 4],
        'purchase_order' => ['prefix' => 'PO', 'padding' => 4],
        'payment' => ['prefix' => 'PAY', 'padding' => 4],
        'stock_movement' => ['prefix' => 'ADJ', 'padding' => 5],
        'user' => ['prefix' => 'USR', 'padding' => 4],
    ],

    /*
    |--------------------------------------------------------------------------
    | Invoice defaults
    |--------------------------------------------------------------------------
    */

    'invoice_due_days' => (int) env('ERP_INVOICE_DUE_DAYS', 30),
    'payment_terms_days' => (int) env('ERP_PAYMENT_TERMS_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    'per_page' => (int) env('ERP_PER_PAGE', 15),
    'max_per_page' => (int) env('ERP_MAX_PER_PAGE', 100),

];