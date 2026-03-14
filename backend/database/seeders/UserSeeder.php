<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'admin@canteen.test')],
            [
                'name' => 'System Admin',
                'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'password')),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'cashier@canteen.test'],
            [
                'name' => 'Main Cashier',
                'password' => Hash::make('password'),
                'role' => User::ROLE_CASHIER,
                'email_verified_at' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'customer@canteen.test'],
            [
                'name' => 'Sample Customer',
                'password' => Hash::make('password'),
                'role' => User::ROLE_CUSTOMER,
                'email_verified_at' => now(),
            ],
        );

        User::factory()->cashier()->count(3)->create();
        User::factory()->customer()->count(25)->create();
    }
}
