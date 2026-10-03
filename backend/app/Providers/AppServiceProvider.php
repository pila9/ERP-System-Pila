<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::preventLazyLoading(false);
        Model::unguard(false);

        Relation::morphMap([
            'sales_order' => \App\Models\SalesOrder::class,
            'purchase_order' => \App\Models\PurchaseOrder::class,
            'invoice' => \App\Models\Invoice::class,
            'payment' => \App\Models\Payment::class,
            'stock_movement' => \App\Models\StockMovement::class,
            'sales_order_item' => \App\Models\SalesOrderItem::class,
            'purchase_order_item' => \App\Models\PurchaseOrderItem::class,
            'invoice_item' => \App\Models\InvoiceItem::class,
        ]);

        Password::defaults(fn () => Password::min(8));
    }
}