<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::query()->pluck('id', 'slug');

        $users = [
            ['name' => 'System Administrator', 'email' => 'admin@erp.test', 'role' => 'admin'],
            ['name' => 'Morgan Reyes', 'email' => 'manager@erp.test', 'role' => 'manager'],
            ['name' => 'Sofia Almeida', 'email' => 'sales@erp.test', 'role' => 'sales_manager'],
            ['name' => 'Liam Chen', 'email' => 'rep@erp.test', 'role' => 'sales_rep'],
            ['name' => 'Priya Nair', 'email' => 'warehouse@erp.test', 'role' => 'warehouse'],
            ['name' => 'Diego Santos', 'email' => 'accountant@erp.test', 'role' => 'accountant'],
            ['name' => 'Ava Novak', 'email' => 'viewer@erp.test', 'role' => 'viewer'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make('password'),
                    'role_id' => $roles[$user['role']] ?? null,
                    'is_active' => true,
                ]
            );
        }
    }
}