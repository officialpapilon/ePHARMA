<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\WholesaleCustomer;
use App\Models\WholesaleOrder;
use App\Models\WholesaleOrderItem;
use App\Models\WholesalePayment;
use App\Models\WholesaleDelivery;
use App\Models\MedicinesCache;
use App\Models\User;

class WholesaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample customers
        $customers = [
            [
                'customer_code' => 'CUST-2025-0001',
                'business_name' => 'ABOVE AVERAGE PHARMACY',
                'contact_person' => 'PAPION',
                'phone_number' => '079090990',
                'email' => 'above@mail.com',
                'address' => 'Dar es Salaam, Tanzania',
                'city' => 'Dar es Salaam',
                'state' => 'MIKOCHENI',
                'country' => 'Tanzania',
                'customer_type' => 'pharmacy',
                'credit_limit_type' => 'limited',
                'credit_limit' => 15000000.00,
                'current_balance' => 0.00,
                'payment_terms' => 'immediate',
                'status' => 'active',
            ],
            [
                'customer_code' => 'CUST-2025-0002',
                'business_name' => 'CITY PHARMACY',
                'contact_person' => 'JOHN DOE',
                'phone_number' => '078123456',
                'email' => 'city@pharmacy.com',
                'address' => 'Mwanza, Tanzania',
                'city' => 'Mwanza',
                'state' => 'NYAMAGANA',
                'country' => 'Tanzania',
                'customer_type' => 'pharmacy',
                'credit_limit_type' => 'limited',
                'credit_limit' => 10000000.00,
                'current_balance' => 0.00,
                'payment_terms' => 'net_30',
                'status' => 'active',
            ],
        ];

        foreach ($customers as $customerData) {
            WholesaleCustomer::create($customerData);
        }

        // Create sample products if they don't exist
        $products = [
            [
                'product_id' => '46',
                'product_name' => 'Activated Charcoal 300gm',
                'product_category' => 'Medicine and Consumables',
                'current_quantity' => 50,
                'wholesale_price' => 5000.00,
                'batch_no' => 'BATCH-001',
            ],
            [
                'product_id' => '47',
                'product_name' => 'Paracetamol 500mg',
                'product_category' => 'Medicine and Consumables',
                'current_quantity' => 100,
                'wholesale_price' => 2500.00,
                'batch_no' => 'BATCH-002',
            ],
            [
                'product_id' => '48',
                'product_name' => 'Amoxicillin 500mg',
                'product_category' => 'Antibiotics',
                'current_quantity' => 75,
                'wholesale_price' => 3500.00,
                'batch_no' => 'BATCH-003',
            ],
        ];

        foreach ($products as $productData) {
            MedicinesCache::updateOrCreate(
                ['product_id' => $productData['product_id']],
                $productData
            );
        }

        // Create sample orders
        $customers = WholesaleCustomer::all();
        $products = MedicinesCache::all();
        $user = User::first();

        if ($customers->count() > 0 && $products->count() > 0 && $user) {
            // Create a sample order
            $order = WholesaleOrder::create([
                'order_number' => 'ORD-2025-0001',
                'customer_id' => $customers->first()->id,
                'created_by' => $user->id,
                'order_type' => 'sale',
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_terms' => 'pay_now',
                'payment_method' => 'cash',
                'delivery_type' => 'delivery',
                'subtotal' => 5000.00,
                'tax_amount' => 350.00,
                'discount_amount' => 0.00,
                'shipping_amount' => 0.00,
                'total_amount' => 5350.00,
                'paid_amount' => 0.00,
                'balance_amount' => 5350.00,
                'order_date' => now(),
                'expected_delivery_date' => now()->addDays(7),
                'due_date' => now()->addDays(30),
                'notes' => 'Sample order for testing',
                'inventory_reserved' => false,
                'inventory_deducted' => false,
            ]);

            // Create order item
            WholesaleOrderItem::create([
                'order_id' => $order->id,
                'product_id' => $products->first()->product_id,
                'batch_no' => $products->first()->batch_no,
                'product_name' => $products->first()->product_name,
                'product_category' => $products->first()->product_category,
                'quantity_ordered' => 1,
                'quantity_delivered' => 0,
                'unit_price' => 5000.00,
                'wholesale_price' => 5000.00,
                'discount_percentage' => 0.00,
                'discount_amount' => 0.00,
                'tax_percentage' => 7.00,
                'tax_amount' => 350.00,
                'subtotal' => 5000.00,
                'total' => 5350.00,
            ]);

            // Create payment record
            WholesalePayment::create([
                'payment_number' => 'PAY-2025-0001',
                'order_id' => $order->id,
                'customer_id' => $customers->first()->id,
                'received_by' => $user->id,
                'payment_type' => 'cash',
                'status' => 'pending',
                'payment_category' => 'full_payment',
                'amount' => 5350.00,
                'amount_received' => 0.00,
                'reference_number' => 'REF-20250802000001',
                'payment_date' => now(),
                'due_date' => now(),
                'notes' => 'Payment initiated from POS',
            ]);
        }
    }
}
