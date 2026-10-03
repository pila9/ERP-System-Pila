<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function run(): void
    {
        $admin = \App\Models\User::query()->where('email', 'admin@erp.test')->value('id');

        // ---------- Warehouses ----------
        $warehouses = collect([
            ['code' => 'WH-MAIN', 'name' => 'Main Warehouse', 'city' => 'Springfield', 'country' => 'USA', 'address' => '1 Industrial Way', 'manager' => 'Priya Nair', 'is_default' => true],
            ['code' => 'WH-NORTH', 'name' => 'North Depot', 'city' => 'Riverton', 'country' => 'USA', 'address' => '44 Depot Road', 'manager' => 'Priya Nair', 'is_default' => false],
            ['code' => 'WH-3PL', 'name' => '3PL Warehouse', 'city' => 'Austin', 'country' => 'USA', 'address' => '900 Logistics Blvd', 'manager' => null, 'is_default' => false],
        ])->mapWithKeys(function (array $row) {
            $warehouse = Warehouse::updateOrCreate(['code' => $row['code']], $row + ['is_active' => true]);

            return [$row['code'] => $warehouse];
        });

        $main = $warehouses['WH-MAIN'];

        // ---------- Units ----------
        $units = collect([
            ['name' => 'Each', 'abbreviation' => 'ea'],
            ['name' => 'Box', 'abbreviation' => 'box'],
            ['name' => 'Carton', 'abbreviation' => 'ctn'],
            ['name' => 'Kilogram', 'abbreviation' => 'kg'],
            ['name' => 'Litre', 'abbreviation' => 'L'],
            ['name' => 'Metre', 'abbreviation' => 'm'],
            ['name' => 'Hour', 'abbreviation' => 'hr'],
            ['name' => 'Pack', 'abbreviation' => 'pk'],
        ])->mapWithKeys(fn (array $row) => [
            $row['name'] => Unit::updateOrCreate(['name' => $row['name']], $row + ['is_active' => true]),
        ]);

        // ---------- Categories ----------
        $categoryTree = [
            'Electronics' => ['Laptops & Computers', 'Mobile Devices', 'Audio', 'Accessories'],
            'Office' => ['Paper & Print', 'Desk Organizers', 'Writing Tools'],
            'Furniture' => ['Desks', 'Chairs', 'Storage'],
            'Industrial' => ['Power Tools', 'Hand Tools', 'Safety Gear'],
            'Consumables' => ['Cleaning', 'Packaging'],
        ];

        $categories = [];
        $parentIndex = 0;

        foreach ($categoryTree as $parentName => $children) {
            $parentIndex++;
            $parent = Category::updateOrCreate(
                ['name' => $parentName],
                [
                    'code' => 'CAT-'.str_pad((string) $parentIndex, 4, '0', STR_PAD_LEFT),
                    'parent_id' => null,
                    'is_active' => true,
                ]
            );

            $categories[$parentName] = $parent;

            foreach ($children as $childIndex => $childName) {
                $child = Category::updateOrCreate(
                    ['name' => $childName],
                    [
                        'code' => 'CAT-'.str_pad((string) ($parentIndex * 10 + $childIndex + 1), 4, '0', STR_PAD_LEFT),
                        'parent_id' => $parent->id,
                        'is_active' => true,
                    ]
                );

                $categories[$childName] = $child;
            }
        }

        // ---------- Products ----------
        $products = [
            ['name' => 'ProBook 14" Ultrabook', 'category' => 'Laptops & Computers', 'unit' => 'Each', 'cost' => 720.00, 'sale' => 1099.00, 'tax' => 10, 'stock' => 45, 'reorder' => 10, 'sku' => 'LAP-U14-001', 'barcode' => '8901234500011'],
            ['name' => 'ProBook 16" Workstation', 'category' => 'Laptops & Computers', 'unit' => 'Each', 'cost' => 1180.00, 'sale' => 1699.00, 'tax' => 10, 'stock' => 18, 'reorder' => 6, 'sku' => 'LAP-U16-002', 'barcode' => '8901234500028'],
            ['name' => '24" LED Monitor', 'category' => 'Laptops & Computers', 'unit' => 'Each', 'cost' => 165.00, 'sale' => 259.00, 'tax' => 10, 'stock' => 62, 'reorder' => 15, 'sku' => 'MON-24-003', 'barcode' => '8901234500035'],
            ['name' => 'USB-C Docking Station', 'category' => 'Accessories', 'unit' => 'Each', 'cost' => 88.00, 'sale' => 149.00, 'tax' => 10, 'stock' => 120, 'reorder' => 25, 'sku' => 'ACC-DOCK-004', 'barcode' => '8901234500042'],
            ['name' => 'Wireless Mouse Pro', 'category' => 'Accessories', 'unit' => 'Each', 'cost' => 19.50, 'sale' => 39.90, 'tax' => 10, 'stock' => 240, 'reorder' => 50, 'sku' => 'ACC-MOUSE-005', 'barcode' => '8901234500059'],
            ['name' => 'Mechanical Keyboard', 'category' => 'Accessories', 'unit' => 'Each', 'cost' => 42.00, 'sale' => 84.00, 'tax' => 10, 'stock' => 0, 'reorder' => 20, 'sku' => 'ACC-KBD-006', 'barcode' => '8901234500066'],
            ['name' => 'Smartphone X12', 'category' => 'Mobile Devices', 'unit' => 'Each', 'cost' => 540.00, 'sale' => 799.00, 'tax' => 10, 'stock' => 33, 'reorder' => 12, 'sku' => 'MOB-X12-007', 'barcode' => '8901234500073'],
            ['name' => 'Noise Cancelling Headset', 'category' => 'Audio', 'unit' => 'Each', 'cost' => 64.00, 'sale' => 129.00, 'tax' => 10, 'stock' => 76, 'reorder' => 20, 'sku' => 'AUD-HS-008', 'barcode' => '8901234500080'],
            ['name' => 'A4 Copy Paper (500 sheets)', 'category' => 'Paper & Print', 'unit' => 'Pack', 'cost' => 4.20, 'sale' => 8.50, 'tax' => 10, 'stock' => 900, 'reorder' => 200, 'sku' => 'OFF-PAP-009', 'barcode' => '8901234500097'],
            ['name' => 'Gel Pens (12 pack)', 'category' => 'Writing Tools', 'unit' => 'Pack', 'cost' => 3.10, 'sale' => 7.90, 'tax' => 10, 'stock' => 480, 'reorder' => 100, 'sku' => 'OFF-PEN-010', 'barcode' => '8901234500103'],
            ['name' => 'Standing Desk 140cm', 'category' => 'Desks', 'unit' => 'Each', 'cost' => 310.00, 'sale' => 529.00, 'tax' => 10, 'stock' => 22, 'reorder' => 5, 'sku' => 'FUR-DSK-011', 'barcode' => '8901234500110'],
            ['name' => 'Ergonomic Task Chair', 'category' => 'Chairs', 'unit' => 'Each', 'cost' => 185.00, 'sale' => 329.00, 'tax' => 10, 'stock' => 41, 'reorder' => 8, 'sku' => 'FUR-CHR-012', 'barcode' => '8901234500127'],
            ['name' => 'Filing Cabinet 3 Drawer', 'category' => 'Storage', 'unit' => 'Each', 'cost' => 148.00, 'sale' => 249.00, 'tax' => 10, 'stock' => 9, 'reorder' => 4, 'sku' => 'FUR-FIL-013', 'barcode' => '8901234500134'],
            ['name' => 'Cordless Drill 18V', 'category' => 'Power Tools', 'unit' => 'Each', 'cost' => 95.00, 'sale' => 179.00, 'tax' => 10, 'stock' => 54, 'reorder' => 12, 'sku' => 'IND-DRL-014', 'barcode' => '8901234500141'],
            ['name' => 'Tool Chest 5 Drawer', 'category' => 'Hand Tools', 'unit' => 'Each', 'cost' => 132.00, 'sale' => 229.00, 'tax' => 10, 'stock' => 6, 'reorder' => 5, 'sku' => 'IND-TCH-015', 'barcode' => '8901234500158'],
            ['name' => 'Safety Helmet (pack of 5)', 'category' => 'Safety Gear', 'unit' => 'Pack', 'cost' => 27.50, 'sale' => 59.00, 'tax' => 10, 'stock' => 130, 'reorder' => 30, 'sku' => 'IND-HLM-016', 'barcode' => '8901234500165'],
            ['name' => 'Cleaning Cart 3 Tier', 'category' => 'Cleaning', 'unit' => 'Each', 'cost' => 78.00, 'sale' => 139.00, 'tax' => 10, 'stock' => 27, 'reorder' => 6, 'sku' => 'CON-CLN-017', 'barcode' => '8901234500172'],
            ['name' => 'Corrugated Boxes (25 pack)', 'category' => 'Packaging', 'unit' => 'Carton', 'cost' => 21.00, 'sale' => 44.00, 'tax' => 10, 'stock' => 310, 'reorder' => 60, 'sku' => 'CON-BOX-018', 'barcode' => '8901234500189'],
        ];

        foreach ($products as $index => $row) {
            $code = 'PRD-'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);

            $product = Product::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $row['name'],
                    'sku' => $row['sku'],
                    'barcode' => $row['barcode'],
                    'category_id' => $categories[$row['category']]->id ?? null,
                    'unit_id' => $units[$row['unit']]->id ?? null,
                    'cost_price' => $row['cost'],
                    'sale_price' => $row['sale'],
                    'tax_rate' => $row['tax'],
                    'track_inventory' => true,
                    'reorder_level' => $row['reorder'],
                    'reorder_quantity' => $row['reorder'] * 2,
                    'is_active' => true,
                ]
            );

            if ($product->stockLevels()->where('warehouse_id', $main->id)->doesntExist()) {
                $this->inventory->apply(
                    $product,
                    $main,
                    (float) $row['stock'],
                    StockMovement::TYPE_IN,
                    $admin,
                    [
                        'note' => 'Opening stock',
                        'unit_cost' => $row['cost'],
                        'update_cost' => true,
                    ]
                );
            }
        }

        // Spread some stock into the second warehouse for realistic reports.
        $productsByCode = Product::query()->take(10)->get();

        foreach ($productsByCode as $product) {
            $this->inventory->apply(
                $product,
                $warehouses['WH-NORTH'],
                max(5, (int) ($product->total_stock / 3)),
                StockMovement::TYPE_IN,
                $admin,
                ['note' => 'Initial depot stock', 'unit_cost' => (float) $product->cost_price]
            );
        }
    }
}