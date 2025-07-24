<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        $mainBranch = Branch::where('name', 'Main Branch')->first();

        $users = [
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'phone_number' => '1234567890',
                'address' => '123 Main St',
                'position' => 'Super Admin',
                'email' => 'admin@example.com',
                'username' => 'admin',
                'password' => Hash::make('password123'),
                'belonged_branches' => $mainBranch ? [$mainBranch->id] : [],
            ],
            [
                'first_name' => 'Pharmacist',
                'last_name' => 'User',
                'phone_number' => '9876543210',
                'address' => '456 Oak Ave',
                'position' => 'Pharmacist',
                'email' => 'pharmacist@example.com',
                'username' => 'pharmacist',
                'password' => Hash::make('password123'),
                'belonged_branches' => $mainBranch ? [$mainBranch->id] : [],
            ],
            [
                'first_name' => 'Cashier',
                'last_name' => 'User',
                'phone_number' => '5555555555',
                'address' => '789 Pine Rd',
                'position' => 'Cashier',
                'email' => 'cashier@example.com',
                'username' => 'cashier',
                'password' => Hash::make('password123'),
            ],
            [
                'first_name' => 'Manager',
                'last_name' => 'User',
                'phone_number' => '1112223333',
                'address' => '321 Elm St',
                'position' => 'Store Manager',
                'email' => 'manager@example.com',
                'username' => 'manager',
                'password' => Hash::make('password123'),
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            if ($user->getBelongedBranchesArray() === [] && isset($userData['belonged_branches'])) {
                foreach ($userData['belonged_branches'] as $branchId) {
                    $user->addBranch($branchId);
                }
                $user->save();
            }
        }
    }
}