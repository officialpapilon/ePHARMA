<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WholesaleCustomer;
use App\Models\WholesaleOrder;
use App\Models\WholesaleOrderItem;
use App\Models\WholesalePayment;
use App\Models\WholesaleDelivery;
use App\Models\MedicinesCache;
use Carbon\Carbon;

class WholesaleSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample customers
        $customers = [
            [
                'business_name' => 'MediCare Hospital',
                'contact_person' => 'Dr. John Smith',
                'phone_number' => '+255 712 345 678',
                'email' => 'info@medicare.co.tz',
                'address' => '123 Hospital Road',
                'city' => 'Dar es Salaam',
                'state' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'customer_type' => 'hospital',
                'credit_limit_type' => 'limited',
                'credit_limit' => 500000,
                'payment_terms' => '30_days',
                'status' => 'active',
            ],
            [
                'business_name' => 'City Clinic',
                'contact_person' => 'Dr. Sarah Johnson',
                'phone_number' => '+255 713 456 789',
                'email' => 'contact@cityclinic.co.tz',
                'address' => '456 Clinic Street',
                'city' => 'Dar es Salaam',
                'state' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'customer_type' => 'clinic',
                'credit_limit_type' => 'limited',
                'credit_limit' => 200000,
                'payment_terms' => '15_days',
                'status' => 'active',
            ],
            [
                'business_name' => 'HealthPlus Pharmacy',
                'contact_person' => 'Mr. Michael Brown',
                'phone_number' => '+255 714 567 890',
                'email' => 'sales@healthplus.co.tz',
                'address' => '789 Pharmacy Avenue',
                'city' => 'Dar es Salaam',
                'state' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'customer_type' => 'pharmacy',
                'credit_limit_type' => 'limited',
                'credit_limit' => 300000,
                'payment_terms' => '7_days',
                'status' => 'active',
            ],
        ];

        foreach ($customers as $customerData) {
            WholesaleCustomer::create($customerData);
        }

        // Get some products for orders (limit to 5 to avoid memory issues)
        $products = MedicinesCache::where('current_quantity', '>', 0)->limit(5)->get();

        if ($products->count() > 0) {
            $customers = WholesaleCustomer::all();
            $orderStatuses = ['draft', 'confirmed', 'processing', 'ready_for_delivery', 'delivered', 'completed'];
            $paymentStatuses = ['pending', 'partial', 'paid'];

            // Create sample orders (reduced to 5)
            for ($i = 1; $i <= 5; $i++) {
                $customer = $customers->random();
                $status = $orderStatuses[array_rand($orderStatuses)];
                $paymentStatus = $paymentStatuses[array_rand($paymentStatuses)];

                $order = WholesaleOrder::create([
                    'customer_id' => $customer->id,
                    'created_by' => 1, // Assuming user ID 1 exists
                    'order_type' => 'sale',
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'shipping_amount' => rand(0, 5000),
                    'order_date' => Carbon::now()->subDays(rand(1, 30)),
                    'expected_delivery_date' => Carbon::now()->addDays(rand(1, 7)),
                    'notes' => 'Sample order for testing',
                ]);

                // Create order items (limit to 2 items per order)
                $numItems = min(2, $products->count());
                $selectedProducts = $products->random($numItems);

                foreach ($selectedProducts as $product) {
                    $quantity = rand(10, 50); // Reduced quantity
                    $wholesalePrice = $product->product_price * 0.8; // 20% discount for wholesale

                    WholesaleOrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->product_id,
                        'batch_no' => $product->batch_no,
                        'product_name' => $product->product_name,
                        'product_category' => $product->product_category,
                        'quantity_ordered' => $quantity,
                        'unit_price' => $product->product_price,
                        'wholesale_price' => $wholesalePrice,
                        'discount_percentage' => rand(0, 10), // Reduced discount
                        'tax_percentage' => 18, // VAT
                    ]);
                }

                // Calculate totals
                $order->calculateTotals();

                // Create payments for some orders
                if (in_array($paymentStatus, ['partial', 'paid'])) {
                    $paymentAmount = $paymentStatus === 'paid' ? $order->total_amount : $order->total_amount * 0.6;
                    
                    WholesalePayment::create([
                        'order_id' => $order->id,
                        'customer_id' => $customer->id,
                        'received_by' => 1,
                        'payment_type' => ['cash', 'bank_transfer', 'mobile_money'][array_rand([0, 1, 2])],
                        'status' => 'completed',
                        'amount' => $paymentAmount,
                        'amount_received' => $paymentAmount,
                        'payment_date' => Carbon::now()->subDays(rand(1, 10)),
                    ]);
                }

                // Create deliveries for some orders
                if (in_array($status, ['ready_for_delivery', 'delivered'])) {
                    WholesaleDelivery::create([
                        'order_id' => $order->id,
                        'customer_id' => $customer->id,
                        'delivered_by' => 1,
                        'status' => $status === 'delivered' ? 'delivered' : 'scheduled',
                        'scheduled_date' => $order->expected_delivery_date,
                        'actual_delivery_date' => $status === 'delivered' ? Carbon::now()->subDays(rand(1, 5)) : null,
                        'delivery_address' => $customer->address . ', ' . $customer->city,
                        'contact_person' => $customer->contact_person,
                        'contact_phone' => $customer->phone_number,
                        'delivery_fee' => rand(0, 3000),
                    ]);
                }
            }
        }
    }
}
