<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Harbor Tech Solutions', 'company' => 'Harbor Tech Solutions Inc.', 'email' => 'purchasing@harbortech.example', 'phone' => '+1 555 0101', 'city' => 'Springfield', 'country' => 'USA', 'address' => '12 Harbour Street', 'credit_limit' => 50000, 'payment_terms_days' => 30],
            ['name' => 'Northwind Trading', 'company' => 'Northwind Trading LLC', 'email' => 'accounts@northwind.example', 'phone' => '+1 555 0102', 'city' => 'Riverton', 'country' => 'USA', 'address' => '88 Market Road', 'credit_limit' => 75000, 'payment_terms_days' => 45],
            ['name' => 'Contoso Retail', 'company' => 'Contoso Retail Group', 'email' => 'ap@contoso.example', 'phone' => '+1 555 0103', 'city' => 'Austin', 'country' => 'USA', 'address' => '4 Commerce Plaza', 'credit_limit' => 30000, 'payment_terms_days' => 15],
            ['name' => 'Acme Manufacturing', 'company' => 'Acme Manufacturing Co.', 'email' => 'finance@acme-mfg.example', 'phone' => '+1 555 0104', 'city' => 'Detroit', 'country' => 'USA', 'address' => '300 Factory Lane', 'credit_limit' => 120000, 'payment_terms_days' => 60],
            ['name' => 'Globex Logistics', 'company' => 'Globex Logistics Ltd.', 'email' => 'billing@globex.example', 'phone' => '+1 555 0105', 'city' => 'Memphis', 'country' => 'USA', 'address' => '77 Cargo Way', 'credit_limit' => 40000, 'payment_terms_days' => 30],
            ['name' => 'Wayne Enterprises', 'company' => 'Wayne Enterprises', 'email' => 'ops@wayne.example', 'phone' => '+1 555 0106', 'city' => 'Gotham', 'country' => 'USA', 'address' => '101 Main Street', 'credit_limit' => 25000, 'payment_terms_days' => 30],
            ['name' => 'Stark Industries', 'company' => 'Stark Industries', 'email' => 'procurement@stark.example', 'phone' => '+1 555 0107', 'city' => 'New York', 'country' => 'USA', 'address' => '200 Park Avenue', 'credit_limit' => 200000, 'payment_terms_days' => 90],
            ['name' => 'Soylent Foods', 'company' => 'Soylent Foods BV', 'email' => 'invoices@soylent.example', 'phone' => '+31 20 555 0108', 'city' => 'Amsterdam', 'country' => 'Netherlands', 'address' => '5 Dock Lane', 'credit_limit' => 35000, 'payment_terms_days' => 30],
        ];

        foreach ($customers as $index => $row) {
            Customer::updateOrCreate(
                ['code' => 'CUS-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT)],
                $row + [
                    'tax_number' => 'TAX'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),
                    'state' => null,
                    'postal_code' => str_pad((string) (10000 + $index), 5, '0', STR_PAD_LEFT),
                    'is_active' => true,
                ]
            );
        }

        $suppliers = [
            ['name' => 'Shenzhen Electronics Ltd.', 'company' => 'Shenzhen Electronics Ltd.', 'email' => 'sales@szelec.example', 'phone' => '+86 755 5550 200', 'city' => 'Shenzhen', 'country' => 'China', 'bank_name' => 'Bank of China', 'bank_account' => '6222 0000 1111 2222', 'payment_terms_days' => 30],
            ['name' => 'Global Office Supplies', 'company' => 'Global Office Supplies GmbH', 'email' => 'orders@globaloffice.example', 'phone' => '+49 30 5550 300', 'city' => 'Berlin', 'country' => 'Germany', 'bank_name' => 'Deutsche Bank', 'bank_account' => 'DE89 3704 0044 0532', 'payment_terms_days' => 45],
            ['name' => 'Pacific Furniture Works', 'company' => 'Pacific Furniture Works', 'email' => 'hello@pacificfurn.example', 'phone' => '+65 6555 0400', 'city' => 'Singapore', 'country' => 'Singapore', 'bank_name' => 'DBS', 'bank_account' => '0051 2233 4455', 'payment_terms_days' => 30],
            ['name' => 'Ironwood Industrial Tools', 'company' => 'Ironwood Industrial Tools', 'email' => 'sales@ironwood.example', 'phone' => '+1 555 0109', 'city' => 'Pittsburgh', 'country' => 'USA', 'bank_name' => 'PNC Bank', 'bank_account' => '4412 7788 9900', 'payment_terms_days' => 21],
            ['name' => 'CleanCare Supply', 'company' => 'CleanCare Supply', 'email' => 'orders@cleancare.example', 'phone' => '+1 555 0110', 'city' => 'Chicago', 'country' => 'USA', 'bank_name' => 'Chase', 'bank_account' => '5590 3322 1144', 'payment_terms_days' => 15],
        ];

        foreach ($suppliers as $index => $row) {
            Supplier::updateOrCreate(
                ['code' => 'SUP-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT)],
                $row + [
                    'tax_number' => 'STX'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),
                    'address' => 'Industrial Park',
                    'state' => null,
                    'postal_code' => str_pad((string) (20000 + $index), 5, '0', STR_PAD_LEFT),
                    'is_active' => true,
                ]
            );
        }
    }
}