<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Revenue;
use App\Models\InventoryItem;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Alert;
use Carbon\Carbon;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample revenue data
        $sources = ['pharmacy', 'wholesale', 'consultation'];
        $paymentMethods = ['cash', 'mobile_money', 'card', 'bank_transfer'];
        $transactionTypes = ['sale', 'refund', 'service'];

        for ($i = 0; $i < 50; $i++) {
            Revenue::create([
                'amount' => rand(1000, 500000),
                'source' => $sources[array_rand($sources)],
                'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'transaction_type' => $transactionTypes[array_rand($transactionTypes)],
                'transaction_date' => Carbon::now()->subDays(rand(0, 30)),
            ]);
        }

        // Create sample inventory items
        $products = [
            ['name' => 'Paracetamol 500mg', 'category' => 'Pain Relief', 'quantity' => 150, 'unit_price' => 500],
            ['name' => 'Amoxicillin 250mg', 'category' => 'Antibiotics', 'quantity' => 75, 'unit_price' => 1200],
            ['name' => 'Vitamin C 1000mg', 'category' => 'Vitamins', 'quantity' => 200, 'unit_price' => 800],
            ['name' => 'Ibuprofen 400mg', 'category' => 'Pain Relief', 'quantity' => 5, 'unit_price' => 600],
            ['name' => 'Omeprazole 20mg', 'category' => 'Gastrointestinal', 'quantity' => 0, 'unit_price' => 1500],
            ['name' => 'Metformin 500mg', 'category' => 'Diabetes', 'quantity' => 120, 'unit_price' => 900],
            ['name' => 'Amlodipine 5mg', 'category' => 'Cardiovascular', 'quantity' => 80, 'unit_price' => 1100],
        ];

        foreach ($products as $product) {
            $status = 'in_stock';
            if ($product['quantity'] == 0) {
                $status = 'out_of_stock';
            } elseif ($product['quantity'] <= 10) {
                $status = 'low_stock';
            }

            InventoryItem::create([
                'name' => $product['name'],
                'category' => $product['category'],
                'quantity' => $product['quantity'],
                'unit_price' => $product['unit_price'],
                'total_value' => $product['quantity'] * $product['unit_price'],
                'expiry_date' => Carbon::now()->addMonths(rand(6, 24)),
                'status' => $status,
            ]);
        }

        // Create sample branches
        $branches = [
            ['name' => 'Main Branch', 'location' => 'Dar es Salaam', 'status' => 'active', 'employee_count' => 15],
            ['name' => 'Arusha Branch', 'location' => 'Arusha', 'status' => 'active', 'employee_count' => 8],
            ['name' => 'Mwanza Branch', 'location' => 'Mwanza', 'status' => 'active', 'employee_count' => 12],
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }

        // Create sample employees
        $employees = [
            ['name' => 'John Doe', 'position' => 'Pharmacist', 'branch_id' => 1, 'transactions_count' => 45, 'total_sales' => 2500000, 'status' => 'active'],
            ['name' => 'Jane Smith', 'position' => 'Cashier', 'branch_id' => 1, 'transactions_count' => 38, 'total_sales' => 1800000, 'status' => 'active'],
            ['name' => 'Mike Johnson', 'position' => 'Pharmacist', 'branch_id' => 2, 'transactions_count' => 32, 'total_sales' => 1600000, 'status' => 'active'],
            ['name' => 'Sarah Wilson', 'position' => 'Manager', 'branch_id' => 3, 'transactions_count' => 28, 'total_sales' => 2200000, 'status' => 'active'],
        ];

        foreach ($employees as $employee) {
            Employee::create($employee);
        }

        // Create sample alerts
        $alerts = [
            [
                'type' => 'low_stock',
                'title' => 'Low Stock Alert',
                'message' => 'Ibuprofen 400mg is running low (5 units remaining)',
                'severity' => 'medium'
            ],
            [
                'type' => 'out_of_stock',
                'title' => 'Out of Stock Alert',
                'message' => 'Omeprazole 20mg is completely out of stock',
                'severity' => 'high'
            ],
            [
                'type' => 'system_alert',
                'title' => 'System Maintenance',
                'message' => 'Scheduled maintenance tonight at 2 AM',
                'severity' => 'low'
            ],
        ];

        foreach ($alerts as $alert) {
            Alert::create($alert);
        }

        // Create sample sales performance data
        for ($i = 0; $i < 30; $i++) {
            DB::table('sales_performance')->insert([
                'product_name' => $products[array_rand($products)]['name'],
                'units_sold' => rand(1, 50),
                'revenue' => rand(5000, 500000),
                'sale_date' => Carbon::now()->subDays(rand(0, 30)),
                'branch_id' => rand(1, 3),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
} 