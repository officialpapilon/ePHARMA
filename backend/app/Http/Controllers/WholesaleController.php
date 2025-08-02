<?php

namespace App\Http\Controllers;

use App\Models\WholesaleOrder;
use App\Models\WholesaleCustomer;
use App\Models\WholesalePayment;
use App\Models\WholesaleDelivery;
use App\Models\MedicinesCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class WholesaleController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getDashboard()
    {
        try {
            $totalOrders = WholesaleOrder::count();
            $totalRevenue = WholesaleOrder::sum('total_amount');
            $pendingOrders = WholesaleOrder::where('status', 'pending_payment')->count();
            $completedOrders = WholesaleOrder::where('status', 'delivered')->count();
            $totalCustomers = WholesaleCustomer::count();
            $overdueOrders = WholesaleOrder::where('due_date', '<', now())->where('status', '!=', 'delivered')->count();
            $lowStockItems = 0; // TODO: Implement low stock calculation

            // Generate weekly stats for charts
            $weeklyStats = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $dayOrders = WholesaleOrder::whereDate('created_at', $date)->get();
                $weeklyStats['dates'][] = now()->subDays($i)->format('M d');
                $weeklyStats['orders'][] = $dayOrders->count();
                $weeklyStats['revenue'][] = $dayOrders->sum('total_amount');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                    'total_customers' => $totalCustomers,
                    'overdue_orders' => $overdueOrders,
                    'low_stock_items' => $lowStockItems,
                    'weekly_stats' => $weeklyStats,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch dashboard data', 'error' => $e->getMessage()], 500);
        }
    }

    public function dashboard()
    {
        try {
            $totalOrders = WholesaleOrder::count();
            $totalRevenue = WholesaleOrder::sum('total_amount');
            $pendingOrders = WholesaleOrder::where('status', 'pending_payment')->count();
            $completedOrders = WholesaleOrder::where('status', 'delivered')->count();
            $totalCustomers = WholesaleCustomer::count();
            $overdueOrders = WholesaleOrder::where('due_date', '<', now())->where('status', '!=', 'delivered')->count();
            $lowStockItems = 0; // TODO: Implement low stock calculation

            // Generate weekly stats for charts
            $weeklyStats = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $dayOrders = WholesaleOrder::whereDate('created_at', $date)->get();
                $weeklyStats['dates'][] = now()->subDays($i)->format('M d');
                $weeklyStats['orders'][] = $dayOrders->count();
                $weeklyStats['revenue'][] = $dayOrders->sum('total_amount');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                    'total_customers' => $totalCustomers,
                    'overdue_orders' => $overdueOrders,
                    'low_stock_items' => $lowStockItems,
                    'weekly_stats' => $weeklyStats,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch dashboard data', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get orders with workflow status
     */
    public function getOrders(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $status = $request->input('status');
            $paymentStatus = $request->input('payment_status');

            $query = WholesaleOrder::with(['customer', 'items', 'payments', 'deliveries']);

            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            }

            $orders = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $orders->items(),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get orders error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch orders'
            ], 500);
        }
    }

    /**
     * Create order from POS
     */
    public function createOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'required|exists:wholesale_customers,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'payment_method' => 'required|in:cash,mobile_money,card',
                'delivery_type' => 'required|in:delivery,pickup',
                'expected_delivery_date' => 'required|date|after:today',
                'notes' => 'nullable|string',
            ]);

            DB::beginTransaction();

            // Calculate totals
            $subtotal = 0;
            $totalTax = 0;
            $totalDiscount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemSubtotal;
            }

            $totalAmount = $subtotal + $totalTax - $totalDiscount;

            // Create order
            $order = WholesaleOrder::create([
                'order_number' => 'ORD-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'customer_id' => $validated['customer_id'],
                'created_by' => Auth::id() ?? 1,
                'order_type' => 'sale',
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_terms' => 'pay_now',
                'payment_method' => $validated['payment_method'],
                'delivery_type' => $validated['delivery_type'],
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'discount_amount' => $totalDiscount,
                'shipping_amount' => 0,
                'total_amount' => $totalAmount,
                'paid_amount' => 0,
                'balance_amount' => $totalAmount,
                'order_date' => now(),
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'due_date' => now()->addDays(30),
                'notes' => $validated['notes'] ?? 'Order created from POS',
                'inventory_reserved' => false,
                'inventory_deducted' => false,
            ]);

            // Create order items
            foreach ($validated['items'] as $item) {
                $product = MedicinesCache::where('product_id', $item['product_id'])->first();
                
                if (!$product) {
                    throw new \Exception("Product not found: {$item['product_id']}");
                }

                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'batch_no' => $product->batch_no ?? 'DEFAULT',
                    'product_name' => $product->product_name,
                    'product_category' => $product->product_category,
                    'quantity_ordered' => $item['quantity'],
                    'quantity_delivered' => 0,
                    'unit_price' => $item['unit_price'],
                    'wholesale_price' => $item['unit_price'],
                    'discount_percentage' => 0,
                    'discount_amount' => 0,
                    'tax_percentage' => 0,
                    'tax_amount' => 0,
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // Create pending payment
            WholesalePayment::create([
                'payment_number' => 'PAY-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'order_id' => $order->id,
                'customer_id' => $validated['customer_id'],
                'received_by' => Auth::id() ?? 1,
                'payment_type' => $validated['payment_method'],
                'status' => 'pending',
                'payment_category' => 'full_payment',
                'amount' => $totalAmount,
                'amount_received' => 0,
                'reference_number' => 'REF-' . date('YmdHis') . rand(100, 999),
                'payment_date' => now(),
                'due_date' => now(),
                'notes' => 'Payment initiated from POS',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => [
                    'order' => $order->load(['customer', 'items']),
                    'next_step' => 'process_payment',
                    'workflow_status' => 'pending_payment'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create order error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process payment for order
     */
    public function processPayment(Request $request, $orderId)
    {
        try {
            DB::beginTransaction();
            $order = WholesaleOrder::findOrFail($orderId);
            
            if ($order->payment_status === 'paid') {
                return response()->json(['success' => false, 'message' => 'Payment has already been processed'], 400);
            }
            
            $amountPaid = $request->input('amount_paid', 0);
            $discountAmount = $request->input('discount_amount', 0);
            $paymentMethod = $request->input('payment_method', 'cash');
            $notes = $request->input('notes', '');
            
            if ($amountPaid <= 0) {
                return response()->json(['success' => false, 'message' => 'Invalid amount paid'], 400);
            }
            
            // Calculate new totals
            $newTotalAmount = $order->total_amount - $discountAmount;
            $newPaidAmount = $order->paid_amount + $amountPaid;
            $newBalanceAmount = $newTotalAmount - $newPaidAmount;
            
            // Update order
            $order->total_amount = $newTotalAmount;
            $order->paid_amount = $newPaidAmount;
            $order->balance_amount = $newBalanceAmount;
            $order->discount_amount = ($order->discount_amount ?? 0) + $discountAmount;
            
            // Determine payment status
            if ($newBalanceAmount <= 0) {
                $order->payment_status = 'paid';
                $order->status = 'confirmed';
            } else {
                $order->payment_status = 'partial';
            }
            
            $order->save();
            
            // Create payment record
            $payment = WholesalePayment::create([
                'payment_number' => 'PAY-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'received_by' => Auth::id() ?? 1,
                'payment_type' => $paymentMethod === 'card' ? 'credit_card' : $paymentMethod,
                'status' => $newBalanceAmount <= 0 ? 'completed' : 'pending',
                'payment_category' => 'full_payment',
                'amount' => $amountPaid,
                'amount_received' => $amountPaid,
                'reference_number' => 'REF-' . time() . rand(100, 999),
                'payment_date' => now(),
                'notes' => $notes
            ]);
            
            // If payment is complete, reduce stock
            if ($newBalanceAmount <= 0) {
                foreach ($order->items as $item) {
                    $product = \App\Models\MedicinesCache::where('product_id', $item->product_id)->first();
                    if ($product) {
                        $product->current_quantity = max(0, $product->current_quantity - $item->quantity_ordered);
                        $product->save();
                    }
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'order' => $order->load(['customer', 'items']),
                    'payment' => $payment,
                    'payment_status' => $order->payment_status,
                    'remaining_balance' => $newBalanceAmount
                ],
                'message' => $newBalanceAmount <= 0 ? 'Payment completed successfully' : 'Partial payment processed'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to process payment', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Schedule delivery for order
     */
    public function scheduleDelivery(Request $request, $orderId)
    {
        try {
            DB::beginTransaction();
            $order = WholesaleOrder::findOrFail($orderId);
            
            if ($order->status !== 'confirmed') {
                return response()->json(['success' => false, 'message' => 'Order must be confirmed before scheduling delivery'], 400);
            }
            
            $delivery = WholesaleDelivery::create([
                'delivery_number' => 'DEL-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'delivered_by' => Auth::id() ?? 1,
                'status' => 'scheduled',
                'scheduled_date' => $request->input('delivery_date', now()->addDays(7)->format('Y-m-d')),
                'delivery_address' => $request->input('delivery_address', $order->customer->address),
                'contact_person' => $request->input('contact_person', $order->customer->contact_person),
                'contact_phone' => $request->input('contact_phone', $order->customer->phone_number),
                'notes' => 'Delivery scheduled from workflow'
            ]);
            
            $order->status = 'ready_for_delivery';
            $order->save();
            
            DB::commit();
            return response()->json(['success' => true, 'data' => $delivery, 'message' => 'Delivery scheduled successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to schedule delivery', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Complete delivery for order
     */
    public function completeDelivery(Request $request, $orderId)
    {
        try {
            DB::beginTransaction();
            $order = WholesaleOrder::findOrFail($orderId);
            
            if ($order->status !== 'ready_for_delivery') {
                return response()->json(['success' => false, 'message' => 'Order is not ready for delivery'], 400);
            }
            
            // Update delivery record
            $delivery = WholesaleDelivery::where('order_id', $order->id)->first();
            if ($delivery) {
                $delivery->status = 'delivered';
                $delivery->actual_delivery_date = now()->format('Y-m-d');
                $delivery->actual_delivery_time = now()->format('H:i:s');
                $delivery->save();
            }
            
            // Update order status
            $order->status = 'delivered';
            $order->save();
            
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Delivery completed successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to complete delivery', 'error' => $e->getMessage()], 500);
        }
    }

    public function getDeliveries(Request $request)
    {
        try {
            $deliveries = WholesaleDelivery::with(['order.customer', 'order.items'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $deliveries
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch deliveries', 'error' => $e->getMessage()], 500);
        }
    }

    public function completeDeliveryWithDetails(Request $request, $deliveryId)
    {
        try {
            DB::beginTransaction();
            $delivery = WholesaleDelivery::with(['order.customer', 'order.items'])->findOrFail($deliveryId);
            
            if ($delivery->status === 'delivered') {
                return response()->json(['success' => false, 'message' => 'Delivery has already been completed'], 400);
            }
            
            $delivery->update([
                'driver_name' => $request->input('driver_name'),
                'driver_phone' => $request->input('driver_phone'),
                'vehicle_number' => $request->input('vehicle_number'),
                'delivery_fee' => $request->input('delivery_fee', 0),
                'actual_delivery_date' => $request->input('actual_delivery_date'),
                'actual_delivery_time' => now()->format('H:i:s'),
                'delivery_notes' => $request->input('delivery_notes'),
                'status' => 'delivered'
            ]);
            
            // Update order status
            $delivery->order->update(['status' => 'delivered']);
            
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Delivery completed successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to complete delivery', 'error' => $e->getMessage()], 500);
        }
    }

    public function generateDeliveryNote(Request $request, $deliveryId)
    {
        try {
            $delivery = WholesaleDelivery::with(['order.customer', 'order.items'])->findOrFail($deliveryId);
            
            // Generate PDF using a library like DomPDF or TCPDF
            // For now, we'll return a success response
            // In a real implementation, you would generate the PDF here
            
            $pdfData = [
                'delivery_number' => $delivery->delivery_number,
                'order_number' => $delivery->order->order_number,
                'customer_name' => $delivery->order->customer->business_name,
                'customer_contact' => $delivery->order->customer->contact_person,
                'delivery_address' => $delivery->delivery_address,
                'contact_phone' => $delivery->contact_phone,
                'scheduled_date' => $delivery->scheduled_date,
                'driver_name' => $delivery->driver_name,
                'vehicle_number' => $delivery->vehicle_number,
                'items' => $delivery->order->items,
                'total_amount' => $delivery->order->total_amount,
                'delivery_fee' => $delivery->delivery_fee,
                'grand_total' => $delivery->order->total_amount + $delivery->delivery_fee
            ];
            
            return response()->json([
                'success' => true,
                'message' => 'Delivery note generated successfully',
                'data' => [
                    'pdf_url' => '/api/wholesale/deliveries/' . $deliveryId . '/download-note',
                    'pdf_data' => $pdfData
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to generate delivery note', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get customers
     */
    public function getCustomers(Request $request)
    {
        try {
            $query = WholesaleCustomer::query();
            
            // Include inactive customers if requested
            if ($request->has('include_inactive') && $request->include_inactive) {
                // Include all customers including inactive
            } else {
                $query->where('status', 'active');
            }
            
            $customers = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch customers', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get products
     */
    public function getProducts()
    {
        try {
            $products = MedicinesCache::where('current_quantity', '>', 0)->get();

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            Log::error('Get products error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products'
            ], 500);
        }
    }

    public function createCustomer(Request $request)
    {
        try {
            $validated = $request->validate([
                'business_name' => 'required|string|max:255',
                'contact_person' => 'required|string|max:255',
                'phone_number' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'address' => 'required|string',
                'city' => 'required|string|max:255',
                'state' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:255',
                'country' => 'required|string|max:255',
                'tax_number' => 'nullable|string|max:255',
                'business_license' => 'nullable|string|max:255',
                'customer_type' => 'required|in:pharmacy,hospital,clinic,distributor,other',
                'credit_limit_type' => 'required|in:unlimited,limited',
                'credit_limit' => 'required|numeric|min:0',
                'payment_terms' => 'required|in:immediate,7_days,15_days,30_days,60_days',
                'status' => 'required|in:active,inactive,suspended',
                'notes' => 'nullable|string',
            ]);

            // Generate customer code
            $lastCustomer = WholesaleCustomer::orderBy('id', 'desc')->first();
            $nextId = $lastCustomer ? $lastCustomer->id + 1 : 1;
            $customerCode = 'CUST-' . date('Y') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $validated['customer_code'] = $customerCode;

            $customer = WholesaleCustomer::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to create customer', 'error' => $e->getMessage()], 500);
        }
    }

    public function updateCustomer(Request $request, $customerId)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($customerId);
            
            $validated = $request->validate([
                'business_name' => 'required|string|max:255',
                'contact_person' => 'required|string|max:255',
                'phone_number' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'address' => 'required|string',
                'city' => 'required|string|max:255',
                'state' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:255',
                'country' => 'required|string|max:255',
                'tax_number' => 'nullable|string|max:255',
                'business_license' => 'nullable|string|max:255',
                'customer_type' => 'required|in:pharmacy,hospital,clinic,distributor,other',
                'credit_limit_type' => 'required|in:unlimited,limited',
                'credit_limit' => 'required|numeric|min:0',
                'payment_terms' => 'required|in:immediate,7_days,15_days,30_days,60_days',
                'status' => 'required|in:active,inactive,suspended',
                'notes' => 'nullable|string',
            ]);

            $customer->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update customer', 'error' => $e->getMessage()], 500);
        }
    }

    public function deactivateCustomer(Request $request, $customerId)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($customerId);
            
            $newStatus = $customer->status === 'active' ? 'inactive' : 'active';
            $customer->update(['status' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => 'Customer ' . ($newStatus === 'active' ? 'activated' : 'deactivated') . ' successfully',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update customer status', 'error' => $e->getMessage()], 500);
        }
    }

    public function getCustomerTransactions(Request $request, $customerId)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($customerId);
            $transactions = WholesaleOrder::where('customer_id', $customerId)
                ->select('id', 'order_number', 'total_amount', 'paid_amount', 'balance_amount', 'payment_status', 'status', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch customer transactions', 'error' => $e->getMessage()], 500);
        }
    }

    public function getReports(Request $request)
    {
        try {
            $dateRange = $request->input('date_range', '7_days');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Calculate date range
            if ($dateRange === 'custom' && $startDate && $endDate) {
                $start = $startDate . ' 00:00:00';
                $end = $endDate . ' 23:59:59';
            } else {
                switch ($dateRange) {
                    case '7_days':
                        $start = now()->subDays(7)->format('Y-m-d H:i:s');
                        $end = now()->format('Y-m-d H:i:s');
                        break;
                    case '30_days':
                        $start = now()->subDays(30)->format('Y-m-d H:i:s');
                        $end = now()->format('Y-m-d H:i:s');
                        break;
                    case '90_days':
                        $start = now()->subDays(90)->format('Y-m-d H:i:s');
                        $end = now()->format('Y-m-d H:i:s');
                        break;
                    default:
                        $start = now()->subDays(7)->format('Y-m-d H:i:s');
                        $end = now()->format('Y-m-d H:i:s');
                }
            }

            // Get orders data with user information
            $orders = WholesaleOrder::whereBetween('created_at', [$start, $end])
                ->with(['customer', 'items', 'createdBy'])
                ->get();

            // Get customers data
            $customers = WholesaleCustomer::all();

            // Get deliveries data with user information
            $deliveries = WholesaleDelivery::whereBetween('created_at', [$start, $end])
                ->with(['order', 'customer', 'deliveredBy'])
                ->get();

            // Get payments data with user information
            $payments = WholesalePayment::whereBetween('created_at', [$start, $end])
                ->with(['order', 'customer', 'receivedBy'])
                ->get();

            // Calculate revenue statistics
            $totalRevenue = $orders->sum('total_amount');
            $collectedRevenue = $orders->sum('paid_amount');
            $pendingRevenue = $orders->sum('balance_amount');

            // Calculate order statistics
            $totalOrders = $orders->count();
            $completedOrders = $orders->where('status', 'delivered')->count();
            $pendingOrders = $orders->where('status', 'pending_payment')->count();
            $cancelledOrders = $orders->where('status', 'cancelled')->count();

            // Calculate customer statistics
            $totalCustomers = $customers->count();
            $activeCustomers = $customers->where('status', 'active')->count();
            $newCustomers = $customers->where('created_at', '>=', $start)->count();

            // Calculate debt statistics
            $totalDebt = $customers->sum('current_balance');
            $debtorsCount = $customers->where('current_balance', '>', 0)->count();
            $averageDebt = $debtorsCount > 0 ? $totalDebt / $debtorsCount : 0;

            // Calculate delivery statistics
            $totalDeliveries = $deliveries->count();
            $completedDeliveries = $deliveries->where('status', 'delivered')->count();
            $scheduledDeliveries = $deliveries->where('status', 'scheduled')->count();
            $inTransitDeliveries = $deliveries->where('status', 'in_transit')->count();

            // Generate weekly stats for charts
            $weeklyStats = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $dayOrders = $orders->filter(function($order) use ($date) {
                    return $order->created_at->format('Y-m-d') === $date;
                });
                $weeklyStats['dates'][] = now()->subDays($i)->format('M d');
                $weeklyStats['orders'][] = $dayOrders->count();
                $weeklyStats['revenue'][] = $dayOrders->sum('total_amount');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    // Revenue data
                    'total_revenue' => $totalRevenue,
                    'collected_revenue' => $collectedRevenue,
                    'pending_revenue' => $pendingRevenue,
                    'revenue_details' => $orders->map(function($order) {
                        return [
                            'id' => $order->id,
                            'order_number' => $order->order_number,
                            'customer' => $order->customer,
                            'total_amount' => $order->total_amount,
                            'paid_amount' => $order->paid_amount,
                            'balance_amount' => $order->balance_amount,
                            'payment_status' => $order->payment_status,
                            'created_at' => $order->created_at,
                            'created_by' => $order->createdBy ? $order->createdBy->name : 'Unknown',
                        ];
                    }),

                    // Orders data
                    'total_orders' => $totalOrders,
                    'completed_orders' => $completedOrders,
                    'pending_orders' => $pendingOrders,
                    'cancelled_orders' => $cancelledOrders,
                    'orders_details' => $orders->map(function($order) {
                        return [
                            'id' => $order->id,
                            'order_number' => $order->order_number,
                            'customer' => $order->customer,
                            'total_amount' => $order->total_amount,
                            'status' => $order->status,
                            'payment_status' => $order->payment_status,
                            'created_at' => $order->created_at,
                            'created_by' => $order->createdBy ? $order->createdBy->name : 'Unknown',
                        ];
                    }),

                    // Customers data
                    'total_customers' => $totalCustomers,
                    'active_customers' => $activeCustomers,
                    'new_customers' => $newCustomers,
                    'customers_details' => $customers->map(function($customer) {
                        return [
                            'id' => $customer->id,
                            'customer_code' => $customer->customer_code,
                            'business_name' => $customer->business_name,
                            'contact_person' => $customer->contact_person,
                            'customer_type' => $customer->customer_type,
                            'credit_limit' => $customer->credit_limit,
                            'current_balance' => $customer->current_balance,
                            'status' => $customer->status,
                        ];
                    }),

                    // Debt data
                    'total_debt' => $totalDebt,
                    'debtors_count' => $debtorsCount,
                    'average_debt' => $averageDebt,
                    'debtors_details' => $customers->where('current_balance', '>', 0)->map(function($customer) {
                        return [
                            'id' => $customer->id,
                            'business_name' => $customer->business_name,
                            'contact_person' => $customer->contact_person,
                            'credit_limit' => $customer->credit_limit,
                            'current_balance' => $customer->current_balance,
                        ];
                    }),

                    // Deliveries data
                    'total_deliveries' => $totalDeliveries,
                    'completed_deliveries' => $completedDeliveries,
                    'scheduled_deliveries' => $scheduledDeliveries,
                    'in_transit_deliveries' => $inTransitDeliveries,
                    'deliveries_details' => $deliveries->map(function($delivery) {
                        return [
                            'id' => $delivery->id,
                            'delivery_number' => $delivery->delivery_number,
                            'customer' => $delivery->customer,
                            'order' => $delivery->order,
                            'status' => $delivery->status,
                            'scheduled_date' => $delivery->scheduled_date,
                            'driver_name' => $delivery->driver_name,
                            'delivered_by' => $delivery->deliveredBy ? $delivery->deliveredBy->name : 'Unknown',
                            'created_at' => $delivery->created_at,
                        ];
                    }),

                    // Payments data
                    'payments_details' => $payments->map(function($payment) {
                        return [
                            'id' => $payment->id,
                            'payment_number' => $payment->payment_number,
                            'order_number' => $payment->order ? $payment->order->order_number : 'N/A',
                            'customer' => $payment->customer,
                            'amount' => $payment->amount,
                            'amount_received' => $payment->amount_received,
                            'payment_type' => $payment->payment_type,
                            'status' => $payment->status,
                            'received_by' => $payment->receivedBy ? $payment->receivedBy->name : 'Unknown',
                            'created_at' => $payment->created_at,
                        ];
                    }),

                    // Weekly stats for charts
                    'weekly_stats' => $weeklyStats,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to generate reports', 'error' => $e->getMessage()], 500);
        }
    }

    public function clearCustomerDebt(Request $request, $customerId)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($customerId);
            $amount = $request->input('amount');
            $paymentMethod = $request->input('payment_method', 'cash');
            $notes = $request->input('notes', 'Debt cleared');

            if ($amount > $customer->current_balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Amount cannot exceed current balance'
                ], 400);
            }

            // Create payment record
            $payment = WholesalePayment::create([
                'payment_number' => 'PAY-' . date('Y') . '-' . str_pad(WholesalePayment::count() + 1, 4, '0', STR_PAD_LEFT),
                'customer_id' => $customerId,
                'order_id' => null, // Standalone debt payment
                'received_by' => Auth::id() ?? 1,
                'payment_type' => $paymentMethod,
                'status' => 'completed',
                'payment_category' => 'full_payment',
                'amount' => $customer->current_balance,
                'amount_received' => $amount,
                'reference_number' => 'REF-' . time(),
                'payment_date' => now(),
                'due_date' => now(),
                'notes' => $notes,
                'receipt_number' => null,
                'is_receipt_generated' => false,
                'is_invoice_generated' => false,
                'invoice_number' => null,
            ]);

            // Update customer balance
            $customer->update([
                'current_balance' => $customer->current_balance - $amount
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Debt cleared successfully',
                'data' => [
                    'customer' => $customer,
                    'payment' => $payment,
                    'cleared_by' => Auth::user() ? Auth::user()->name : 'System'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to clear debt', 'error' => $e->getMessage()], 500);
        }
    }
} 