<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BranchSeeder extends Seeder
{
    public function run()
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'phone_number' => '1234567890',
                'address' => '123 Dar es Salaam',
                'position' => 'Super Admin',
                'email' => 'admin@example.com',
                'username' => 'admin',
                'password' => Hash::make('password123'),
            ]
        );

        $pharmacy = Pharmacy::firstOrCreate(
            ['license_number' => 'PH123456'],
            [
                'user_id' => $admin->id,
                'name' => 'Main Pharmacy',
                'address' => '123 Dar es Salaam',
                'contact_phone' => '1234567890',
                'is_active' => true
            ]
        );

        $mainBranch = Branch::firstOrCreate(
            ['pharmacy_id' => $pharmacy->id, 'name' => 'Main Branch'],
            [
                'address' => '123 Dar es Salaam',
                'contact_phone' => '1234567890',
                'is_active' => true
            ]
        );

        $admin->addBranch($mainBranch->id);
        $admin->save();

    }
}