<?php

namespace App\Http\Controllers;

use App\Models\WholesaleOrder;
use App\Models\WholesaleOrderItem;
use App\Models\WholesaleCustomer;
use App\Models\MedicinesCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
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

    public function store(Request $request)
    {
        try {
            Log::info('Order creation started', $request->all());
            
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'customer_id' => 'required|exists:wholesale_customers,id',
                'order_type' => 'required|in:sale,quotation,reservation',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|string',
                'items.*.batch_no' => 'required|string',
                'items.*.quantity_ordered' => 'required|integer|min:1',
                'items.*.wholesale_price' => 'required|numeric|min:0',
                'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
                'items.*.tax_percentage' => 'nullable|numeric|min:0|max:100',
                'shipping_amount' => 'nullable|numeric|min:0',
                'expected_delivery_date' => 'nullable|date|after_or_equal:today',
                'notes' => 'nullable|string',
                'delivery_instructions' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Validation passed');

            // Check customer credit limit
            $customer = WholesaleCustomer::findOrFail($request->customer_id);
            $totalAmount = 0;

            // Calculate total amount
            foreach ($request->items as $item) {
                $subtotal = $item['quantity_ordered'] * $item['wholesale_price'];
                $discount = ($subtotal * ($item['discount_percentage'] ?? 0)) / 100;
                $taxableAmount = $subtotal - $discount;
                $tax = ($taxableAmount * ($item['tax_percentage'] ?? 0)) / 100;
                $totalAmount += $subtotal - $discount + $tax;
            }

            $totalAmount += $request->shipping_amount ?? 0;

            Log::info('Total amount calculated', ['total' => $totalAmount]);

            if (!$customer->canPlaceOrder($totalAmount)) {
                Log::error('Customer credit limit exceeded', ['customer_id' => $customer->id, 'total' => $totalAmount]);
                return response()->json([
                    'success' => false,
                    'message' => 'Customer credit limit exceeded or customer is inactive'
                ], 400);
            }

            Log::info('Credit check passed');

            // Check stock availability
            foreach ($request->items as $item) {
                $product = MedicinesCache::where('product_id', $item['product_id'])
                    ->where('batch_no', $item['batch_no'])
                    ->first();

                if (!$product) {
                    Log::error('Product not found', ['product_id' => $item['product_id'], 'batch_no' => $item['batch_no']]);
                    return response()->json([
                        'success' => false,
                        'message' => "Product {$item['product_id']} with batch {$item['batch_no']} not found"
                    ], 404);
                }

                if ($product->current_quantity < $item['quantity_ordered']) {
                    Log::error('Insufficient stock', ['product' => $product->product_name, 'available' => $product->current_quantity, 'requested' => $item['quantity_ordered']]);
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for product {$product->product_name}. Available: {$product->current_quantity}, Requested: {$item['quantity_ordered']}"
                    ], 400);
                }
            }

            Log::info('Stock check passed');

            // Get authenticated user with fallback
            $user = null;
            if ($request->user()) {
                $user = $request->user();
            } elseif (Auth::check()) {
                $user = Auth::user();
            } else {
                // Try to get user from token
                $token = $request->bearerToken();
                if ($token) {
                    $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                    if ($tokenModel) {
                        $user = $tokenModel->tokenable;
                    }
                }
            }

            // Create order
            $orderData = [
                'customer_id' => $request->customer_id,
                'created_by' => $user ? $user->id : 1, // Fallback to user ID 1 if no user found
                'order_type' => $request->order_type,
                'status' => 'draft',
                'payment_status' => 'pending',
                'shipping_amount' => $request->shipping_amount ?? 0,
                'expected_delivery_date' => $request->expected_delivery_date,
                'notes' => $request->notes,
                'delivery_instructions' => $request->delivery_instructions,
            ];

            Log::info('Creating order with data', $orderData);

            $order = WholesaleOrder::create($orderData);

            Log::info('Order created', ['order_id' => $order->id]);

            // Create order items
            foreach ($request->items as $item) {
                $product = MedicinesCache::where('product_id', $item['product_id'])
                    ->where('batch_no', $item['batch_no'])
                    ->first();

                $itemData = [
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'batch_no' => $item['batch_no'],
                    'product_name' => $product->product_name,
                    'product_category' => $product->product_category,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'unit_price' => $product->product_price,
                    'wholesale_price' => $item['wholesale_price'],
                    'discount_percentage' => $item['discount_percentage'] ?? 0,
                    'tax_percentage' => $item['tax_percentage'] ?? 0,
                ];

                Log::info('Creating order item', $itemData);

                WholesaleOrderItem::create($itemData);
            }

            Log::info('Order items created');

            // Calculate totals
            $order->calculateTotals();

            Log::info('Totals calculated');

            DB::commit();

            Log::info('Order creation completed successfully', ['order_id' => $order->id]);

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'items']),
                'message' => 'Order created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
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
