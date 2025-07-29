<?php

namespace App\Http\Controllers;

use App\Models\WholesaleOrder;
use App\Models\WholesaleOrderItem;
use App\Models\WholesalePayment;
use App\Models\WholesaleCustomer;
use App\Models\MedicinesCache;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class WholesaleOrderController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status');
            $paymentStatus = $request->input('payment_status');
            $customerId = $request->input('customer_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = WholesaleOrder::query()
                ->with(['customer', 'createdBy', 'items', 'payments', 'deliveries']);

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                      ->orWhere('invoice_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('business_name', 'like', "%{$search}%")
                                       ->orWhere('contact_person', 'like', "%{$search}%");
                      });
                });
            }

            // Apply filters
            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            }

            if ($customerId) {
                $query->where('customer_id', $customerId);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('order_date', [$startDate, $endDate]);
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $orders = $query->paginate($perPage);

            // Calculate summary statistics
            $summary = [
                'total_orders' => WholesaleOrder::count(),
                'total_revenue' => WholesaleOrder::sum('total_amount'),
                'total_paid' => WholesaleOrder::sum('paid_amount'),
                'total_outstanding' => WholesaleOrder::sum('balance_amount'),
                'orders_by_status' => WholesaleOrder::select('status', DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get(),
                'orders_by_payment_status' => WholesaleOrder::select('payment_status', DB::raw('count(*) as count'))
                    ->groupBy('payment_status')
                    ->get(),
                'overdue_orders' => WholesaleOrder::overdue()->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $orders->items(),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'from' => $orders->firstItem(),
                    'to' => $orders->lastItem(),
                ],
                'summary' => $summary,
                'message' => 'Orders retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created order with inventory reservation
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'required|exists:wholesale_customers,id',
                'order_type' => 'required|in:sale,purchase,return',
                'payment_terms' => 'required|in:pay_now,pay_later,partial_payment',
                'payment_method' => 'required|in:cash,mobile_money,card',
                'delivery_type' => 'required|in:delivery,pickup',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|string',
                'items.*.batch_no' => 'nullable|string', // Make batch_no nullable and ensure it's string
                'items.*.quantity_ordered' => 'required|integer|min:1',
                'items.*.wholesale_price' => 'required|numeric|min:0',
                'items.*.discount_percentage' => 'required|numeric|min:0|max:100',
                'items.*.tax_percentage' => 'required|numeric|min:0|max:100',
                'expected_delivery_date' => 'required|date|after:today',
                'notes' => 'nullable|string|max:500',
                'shipping_amount' => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            // Calculate totals
            $subtotal = 0;
            $totalTax = 0;
            $totalDiscount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity_ordered'] * $item['wholesale_price'];
                $itemDiscount = ($itemSubtotal * $item['discount_percentage']) / 100;
                $itemTax = (($itemSubtotal - $itemDiscount) * $item['tax_percentage']) / 100;
                
                $subtotal += $itemSubtotal;
                $totalDiscount += $itemDiscount;
                $totalTax += $itemTax;
            }

            $totalAmount = $subtotal - $totalDiscount + $totalTax + $validated['shipping_amount'];

            // Create order
            $order = WholesaleOrder::create([
                'order_number' => 'ORD-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'customer_id' => $validated['customer_id'],
                'created_by' => Auth::id() ?? 1,
                'order_type' => $validated['order_type'],
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_terms' => $validated['payment_terms'],
                'payment_method' => $validated['payment_method'],
                'delivery_type' => $validated['delivery_type'],
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'discount_amount' => $totalDiscount,
                'shipping_amount' => $validated['shipping_amount'],
                'total_amount' => $totalAmount,
                'paid_amount' => 0,
                'balance_amount' => $totalAmount,
                'order_date' => now(),
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'due_date' => now()->addDays(30),
                'notes' => $validated['notes'] ?? 'Order created from POS',
                'delivery_instructions' => '',
                'inventory_reserved' => false,
                'inventory_deducted' => false,
            ]);

            // Create order items
            foreach ($validated['items'] as $item) {
                // Fetch product details from medicines cache
                $product = MedicinesCache::where('product_id', $item['product_id'])
                    ->where('batch_no', $item['batch_no'])
                    ->first();

                if (!$product) {
                    // Try to find by product_id only
                    $product = MedicinesCache::where('product_id', $item['product_id'])->first();
                    if (!$product) {
                        throw new \Exception("Product not found: {$item['product_id']}");
                    }
                    Log::warning("Exact batch not found for product {$item['product_id']}, using available batch");
                }

                $itemSubtotal = $item['quantity_ordered'] * $item['wholesale_price'];
                $itemDiscount = ($itemSubtotal * $item['discount_percentage']) / 100;
                $itemTax = (($itemSubtotal - $itemDiscount) * $item['tax_percentage']) / 100;
                $itemTotal = $itemSubtotal - $itemDiscount + $itemTax;

                WholesaleOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'batch_no' => (string)($item['batch_no'] ?? 'DEFAULT-BATCH'), // Ensure it's always a string
                    'product_name' => $product->product_name,
                    'product_category' => $product->product_category,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_delivered' => 0,
                    'unit_price' => $item['wholesale_price'],
                    'wholesale_price' => $item['wholesale_price'],
                    'discount_percentage' => $item['discount_percentage'],
                    'discount_amount' => $itemDiscount,
                    'tax_percentage' => $item['tax_percentage'],
                    'tax_amount' => $itemTax,
                    'subtotal' => $itemSubtotal,
                    'total' => $itemTotal,
                    'notes' => null,
                ]);
            }

            // Reserve inventory
            $order->reserveInventory();

            // Create pending payment record
            $payment = WholesalePayment::create([
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
                'bank_name' => null,
                'account_number' => null,
                'cheque_number' => null,
                'payment_date' => now(),
                'due_date' => now(),
                'notes' => 'Payment initiated from POS',
                'receipt_number' => null,
                'is_receipt_generated' => false,
                'is_invoice_generated' => false,
                'invoice_number' => null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully and inventory reserved',
                'data' => [
                    'order' => $order->load(['customer', 'items']),
                    'payment' => $payment,
                    'next_step' => 'payment_processing',
                    'workflow_status' => 'payment_pending'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $order = WholesaleOrder::with([
                'customer',
                'createdBy',
                'items',
                'payments' => function($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'deliveries' => function($query) {
                    $query->orderBy('created_at', 'desc');
                }
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $order,
                'message' => 'Order details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve order details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $order = WholesaleOrder::findOrFail($id);

            if (!in_array($order->status, ['draft', 'confirmed'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order cannot be modified in current status'
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'expected_delivery_date' => 'nullable|date|after_or_equal:today',
                'notes' => 'nullable|string',
                'delivery_instructions' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $order->update($request->only([
                'expected_delivery_date',
                'notes',
                'delivery_instructions'
            ]));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items', 'payments']),
                'message' => 'Order updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $order = WholesaleOrder::findOrFail($id);

            if (!in_array($order->status, ['draft'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order cannot be deleted in current status'
                ], 400);
            }

            $order->delete();

            return response()->json([
                'success' => true,
                'message' => 'Order deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirm($id)
    {
        try {
            DB::beginTransaction();

            $order = WholesaleOrder::findOrFail($id);

            if ($order->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order can only be confirmed from draft status'
                ], 400);
            }

            // Check stock availability again
            foreach ($order->items as $item) {
                $product = MedicinesCache::where('product_id', $item->product_id)
                    ->where('batch_no', $item->batch_no)
                    ->first();

                if (!$product || $product->current_quantity < $item->quantity_ordered) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for product {$item->product_name}"
                    ], 400);
                }
            }

            $order->status = 'confirmed';
            $order->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items']),
                'message' => 'Order confirmed successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function process($id)
    {
        try {
            DB::beginTransaction();

            $order = WholesaleOrder::findOrFail($id);

            if ($order->status !== 'confirmed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order can only be processed from confirmed status'
                ], 400);
            }

            // Reduce stock
            foreach ($order->items as $item) {
                $product = MedicinesCache::where('product_id', $item->product_id)
                    ->where('batch_no', $item->batch_no)
                    ->first();

                if ($product) {
                    $product->current_quantity -= $item->quantity_ordered;
                    $product->save();
                }
            }

            $order->status = 'processing';
            $order->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items']),
                'message' => 'Order processed and stock reduced successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function readyForDelivery($id)
    {
        try {
            $order = WholesaleOrder::findOrFail($id);

            if ($order->status !== 'processing') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order can only be marked ready from processing status'
                ], 400);
            }

            $order->status = 'ready_for_delivery';
            $order->save();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items']),
                'message' => 'Order marked ready for delivery'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark order ready for delivery',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function complete($id)
    {
        try {
            $order = WholesaleOrder::findOrFail($id);

            if (!in_array($order->status, ['ready_for_delivery', 'delivered'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order can only be completed from ready_for_delivery or delivered status'
                ], 400);
            }

            $order->status = 'completed';
            $order->save();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items']),
                'message' => 'Order completed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cancel($id)
    {
        try {
            DB::beginTransaction();

            $order = WholesaleOrder::findOrFail($id);

            if (!in_array($order->status, ['draft', 'confirmed'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order can only be cancelled from draft or confirmed status'
                ], 400);
            }

            // If order was confirmed, restore stock
            if ($order->status === 'confirmed') {
                foreach ($order->items as $item) {
                    $product = MedicinesCache::where('product_id', $item->product_id)
                        ->where('batch_no', $item->batch_no)
                        ->first();

                    if ($product) {
                        $product->current_quantity += $item->quantity_ordered;
                        $product->save();
                    }
                }
            }

            $order->status = 'cancelled';
            $order->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items']),
                'message' => 'Order cancelled successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getProducts(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 20);
            $search = $request->input('search');
            $category = $request->input('category');

            $query = MedicinesCache::query()
                ->where('current_quantity', '>', 0);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('product_name', 'like', "%{$search}%")
                      ->orWhere('product_id', 'like', "%{$search}%")
                      ->orWhere('batch_no', 'like', "%{$search}%");
                });
            }

            if ($category) {
                $query->where('product_category', $category);
            }

            $products = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
                'message' => 'Products retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function searchProducts(Request $request)
    {
        try {
            $search = $request->input('search');
            $limit = $request->input('limit', 10);

            if (!$search) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No search term provided'
                ]);
            }

            $products = MedicinesCache::where('current_quantity', '>', 0)
                ->where(function($query) use ($search) {
                    $query->where('product_name', 'like', "%{$search}%")
                          ->orWhere('product_id', 'like', "%{$search}%")
                          ->orWhere('batch_no', 'like', "%{$search}%");
                })
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products,
                'message' => 'Products found successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
