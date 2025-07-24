<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run()
    {
        $customers = [];

        for ($i = 1; $i <= 100; $i++) {
            $customers[] = [
                'id' => 1000 + $i, 
                'first_name' => 'Customer ' . $i,
                'last_name' => 'Test',
                'phone' => '555123456' . $i,
                'address' => 'Address ' . $i,
                'age' => rand(20, 50),
                'created_at' => now(), 
                'updated_at' => now(),
            ];
        }

        Customer::insert($customers);
    }
}
