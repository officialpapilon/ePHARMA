<?php

namespace App\Http\Controllers;

use App\Models\WholesaleDelivery;
use App\Models\WholesaleOrder;
use App\Models\WholesaleCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class WholesaleDeliveryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = WholesaleDelivery::query()
                ->with(['order', 'customer', 'order.customer']);

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('delivery_number', 'like', "%{$search}%")
                      ->orWhere('tracking_number', 'like', "%{$search}%")
                      ->orWhereHas('order', function($orderQuery) use ($search) {
                          $orderQuery->where('order_number', 'like', "%{$search}%");
                      })
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

            if ($startDate && $endDate) {
                $query->whereBetween('delivery_date', [$startDate, $endDate]);
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $deliveries = $query->paginate($perPage);

            // Calculate summary statistics
            $summary = [
                'total_deliveries' => WholesaleDelivery::count(),
                'scheduled_deliveries' => WholesaleDelivery::where('status', 'scheduled')->count(),
                'in_transit_deliveries' => WholesaleDelivery::where('status', 'in_transit')->count(),
                'delivered_deliveries' => WholesaleDelivery::where('status', 'delivered')->count(),
                'failed_deliveries' => WholesaleDelivery::where('status', 'failed')->count(),
                'total_delivery_cost' => WholesaleDelivery::sum('delivery_fee'),
                'average_delivery_time' => WholesaleDelivery::whereNotNull('actual_delivery_date')
                    ->whereNotNull('scheduled_date')
                    ->avg(DB::raw('DATEDIFF(actual_delivery_date, scheduled_date)')),
            ];

            return response()->json([
                'success' => true,
                'data' => $deliveries->items(),
                'meta' => [
                    'current_page' => $deliveries->currentPage(),
                    'last_page' => $deliveries->lastPage(),
                    'per_page' => $deliveries->perPage(),
                    'total' => $deliveries->total(),
                    'from' => $deliveries->firstItem(),
                    'to' => $deliveries->lastItem(),
                ],
                'summary' => $summary,
                'message' => 'Deliveries retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve deliveries',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'order_id' => 'required|exists:wholesale_orders,id',
                'customer_id' => 'required|exists:wholesale_customers,id',
                'delivery_date' => 'required|date',
                'delivery_address' => 'required|string|max:255',
                'contact_person' => 'required|string|max:255',
                'contact_phone' => 'required|string|max:20',
                'delivery_fee' => 'required|numeric|min:0',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Generate delivery number
            $lastDelivery = WholesaleDelivery::orderBy('id', 'desc')->first();
            $deliveryNumber = 'DEL' . str_pad(($lastDelivery ? $lastDelivery->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            $delivery = WholesaleDelivery::create([
                'delivery_number' => $deliveryNumber,
                'order_id' => $request->order_id,
                'customer_id' => $request->customer_id,
                'scheduled_date' => $request->delivery_date,
                'delivery_address' => $request->delivery_address || 'Default Address',
                'contact_person' => $request->contact_person || 'Contact Person',
                'contact_phone' => $request->contact_phone || 'Contact Phone',
                'delivery_fee' => $request->delivery_fee,
                'notes' => $request->notes,
                'status' => 'scheduled',
            ]);

            return response()->json([
                'success' => true,
                'data' => $delivery->load(['order', 'customer']),
                'message' => 'Delivery created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create delivery',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $delivery = WholesaleDelivery::with(['order', 'customer', 'order.customer'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $delivery,
                'message' => 'Delivery retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $delivery = WholesaleDelivery::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'delivery_date' => 'sometimes|required|date',
                'delivery_address' => 'sometimes|required|string|max:255',
                'contact_person' => 'sometimes|required|string|max:255',
                'contact_phone' => 'sometimes|required|string|max:20',
                'delivery_fee' => 'sometimes|required|numeric|min:0',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only([
                'delivery_address',
                'contact_person',
                'contact_phone',
                'delivery_fee',
                'notes',
            ]);

            // Map delivery_date to scheduled_date
            if ($request->has('delivery_date')) {
                $updateData['scheduled_date'] = $request->delivery_date;
            }

            $delivery->update($updateData);

            return response()->json([
                'success' => true,
                'data' => $delivery->load(['order', 'customer']),
                'message' => 'Delivery updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $delivery = WholesaleDelivery::findOrFail($id);
            $delivery->delete();

            return response()->json([
                'success' => true,
                'message' => 'Delivery deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete delivery',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markInTransit($id)
    {
        try {
            $delivery = WholesaleDelivery::findOrFail($id);
            
            if ($delivery->status !== 'scheduled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only scheduled deliveries can be marked as in transit'
                ], 400);
            }

            $delivery->update([
                'status' => 'in_transit',
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $delivery->load(['order', 'customer']),
                'message' => 'Delivery marked as in transit'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markDelivered($id)
    {
        try {
            $delivery = WholesaleDelivery::findOrFail($id);
            
            if ($delivery->status !== 'in_transit') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only in-transit deliveries can be marked as delivered'
                ], 400);
            }

            $delivery->update([
                'status' => 'delivered',
                'actual_delivery_date' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $delivery->load(['order', 'customer']),
                'message' => 'Delivery marked as delivered'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markFailed($id)
    {
        try {
            $delivery = WholesaleDelivery::findOrFail($id);
            
            if (!in_array($delivery->status, ['scheduled', 'in_transit'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only scheduled or in-transit deliveries can be marked as failed'
                ], 400);
            }

            $delivery->update([
                'status' => 'failed',
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $delivery->load(['order', 'customer']),
                'message' => 'Delivery marked as failed'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDeliveryMethods()
    {
        $methods = [
            'courier' => 'Courier Service',
            'own_vehicle' => 'Own Vehicle',
            'third_party' => 'Third Party Logistics',
            'pickup' => 'Customer Pickup',
            'express' => 'Express Delivery',
        ];

        return response()->json([
            'success' => true,
            'data' => $methods,
            'message' => 'Delivery methods retrieved successfully'
        ]);
    }

    public function createFromOrder(Request $request, $orderId)
    {
        $validated = $request->validate([
            'delivery_date' => 'required|date|after_or_equal:today',
            'delivery_address' => 'required|string',
            'contact_person' => 'required|string',
            'contact_phone' => 'required|string',
            'delivery_fee' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $order = WholesaleOrder::with(['customer', 'items'])->findOrFail($orderId);
            
            // Check if order is ready for delivery
            if ($order->payment_status !== 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order must be fully paid before creating delivery'
                ], 400);
            }

            if ($order->status !== 'confirmed' && $order->status !== 'processing') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order must be confirmed or processing before creating delivery'
                ], 400);
            }

            // Check if delivery already exists
            $existingDelivery = WholesaleDelivery::where('order_id', $orderId)->first();
            if ($existingDelivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery already exists for this order'
                ], 400);
            }

            // Create delivery
            $delivery = WholesaleDelivery::create([
                'delivery_number' => 'DEL-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'order_id' => $orderId,
                'customer_id' => $order->customer_id,
                'scheduled_date' => $validated['delivery_date'],
                'status' => 'scheduled',
                'delivery_address' => $validated['delivery_address'],
                'contact_person' => $validated['contact_person'],
                'contact_phone' => $validated['contact_phone'],
                'delivery_fee' => $validated['delivery_fee'] ?? 0,
                'notes' => $validated['notes'],
            ]);

            // Update order status
            $order->update([
                'status' => 'ready_for_delivery',
                'is_delivery_scheduled' => true,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Delivery created successfully',
                'data' => [
                    'delivery' => $delivery->load(['order', 'customer']),
                    'order' => $order->load(['customer', 'items']),
                    'next_step' => 'approve_delivery'
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    public function approveDelivery(Request $request, $deliveryId)
    {
        $validated = $request->validate([
            'actual_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $delivery = WholesaleDelivery::with(['order', 'order.items'])->findOrFail($deliveryId);
            
            if ($delivery->status !== 'scheduled' && $delivery->status !== 'in_transit') {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery is not in a state that can be approved'
                ], 400);
            }

            // Update delivery status
            $delivery->update([
                'status' => 'delivered',
                'actual_delivery_date' => $validated['actual_delivery_date'] ?? now(),
                'delivered_by' => Auth::id() ?? 1,
                'notes' => $validated['notes'] ?? $delivery->notes,
            ]);

            // Update order status
            $order = $delivery->order;
            $order->update([
                'status' => 'completed',
                'actual_delivery_date' => $delivery->actual_delivery_date,
                'is_delivered' => true,
            ]);

            // Update delivered quantities in order items
            foreach ($order->items as $item) {
                $item->update([
                    'quantity_delivered' => $item->quantity_ordered,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Delivery approved successfully',
                'data' => [
                    'delivery' => $delivery->load(['order', 'customer']),
                    'order' => $order->load(['customer', 'items']),
                    'workflow_completed' => true
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle order fulfillment - capture delivery details and create delivery record
     */
    public function fulfillOrder(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'delivery_address' => 'required|string|max:500',
                'contact_person' => 'required|string|max:100',
                'contact_phone' => 'required|string|max:20',
                'delivery_fee' => 'required|numeric|min:0',
                'expected_delivery_date' => 'required|date|after:today',
                'delivery_instructions' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            $order = WholesaleOrder::findOrFail($orderId);
            
            if ($order->status !== 'confirmed' || $order->payment_status !== 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order must be confirmed and paid before fulfillment'
                ], 400);
            }

            // Update order with delivery details
            $order->update([
                'status' => 'ready_for_delivery',
                'delivery_address' => $validated['delivery_address'],
                'delivery_contact_person' => $validated['contact_person'],
                'delivery_contact_phone' => $validated['contact_phone'],
                'delivery_instructions' => $validated['delivery_instructions'] ?? '',
            ]);

            // Create delivery record
            $delivery = WholesaleDelivery::create([
                'delivery_number' => 'DEL-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'order_id' => $orderId,
                'customer_id' => $order->customer_id,
                'created_by' => Auth::id() ?? 1,
                'delivery_date' => $validated['expected_delivery_date'],
                'actual_delivery_date' => null,
                'status' => 'scheduled',
                'delivery_address' => $validated['delivery_address'],
                'contact_person' => $validated['contact_person'],
                'contact_phone' => $validated['contact_phone'],
                'delivery_fee' => $validated['delivery_fee'],
                'notes' => $validated['notes'] ?? 'Delivery scheduled from order fulfillment',
                'delivered_by' => null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order fulfilled successfully and delivery scheduled',
                'data' => [
                    'order' => $order->load(['customer', 'items']),
                    'delivery' => $delivery,
                    'next_step' => 'delivery_management',
                    'workflow_status' => 'ready_for_delivery'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order fulfillment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fulfill order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign delivery person to order
     */
    public function assignDelivery(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'delivery_person_id' => 'required|exists:users,id',
                'notes' => 'nullable|string|max:500',
            ]);

            $order = WholesaleOrder::findOrFail($orderId);
            
            if ($order->status !== 'ready_for_delivery') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order is not ready for delivery assignment'
                ], 400);
            }

            $order->update([
                'assigned_delivery_person_id' => $validated['delivery_person_id'],
                'status' => 'assigned_to_delivery',
                'notes' => $order->notes . ' | ' . ($validated['notes'] ?? 'Delivery assigned'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Delivery person assigned successfully',
                'data' => [
                    'order' => $order->load(['customer', 'items', 'deliveryPerson']),
                    'next_step' => 'delivery_execution',
                    'workflow_status' => 'delivery_assigned'
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Delivery assignment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update delivery status by delivery person
     */
    public function updateDeliveryStatus(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:out_for_delivery,picked_by_customer,delivered',
                'notes' => 'nullable|string|max:500',
                'actual_delivery_date' => 'nullable|date',
            ]);

            $order = WholesaleOrder::findOrFail($orderId);
            
            if (!in_array($order->status, ['assigned_to_delivery', 'out_for_delivery'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order is not in correct status for delivery update'
                ], 400);
            }

            $order->update([
                'status' => $validated['status'],
                'actual_delivery_date' => $validated['actual_delivery_date'] ?? now(),
                'notes' => $order->notes . ' | ' . ($validated['notes'] ?? 'Delivery status updated'),
            ]);

            // Generate delivery note if delivered
            if ($validated['status'] === 'delivered' || $validated['status'] === 'picked_by_customer') {
                $order->generateDeliveryNoteNumber();
                $order->update([
                    'is_delivered' => true,
                    'status' => 'completed'
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Delivery status updated successfully',
                'data' => [
                    'order' => $order->load(['customer', 'items', 'deliveryPerson']),
                    'delivery_note_number' => $order->delivery_note_number,
                    'next_step' => $validated['status'] === 'delivered' ? 'completed' : 'delivery_tracking',
                    'workflow_status' => 'delivery_updated'
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Delivery status update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel order and release inventory
     */
    public function cancelOrder(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $order = WholesaleOrder::findOrFail($orderId);
            
            if (in_array($order->status, ['delivered', 'completed'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel completed order'
                ], 400);
            }

            DB::beginTransaction();

            // Release inventory if reserved
            $order->releaseInventory();

            // Update order status
            $order->update([
                'status' => 'cancelled',
                'notes' => $order->notes . ' | Cancelled: ' . $validated['reason'],
            ]);

            // Cancel associated payment
            $payment = WholesalePayment::where('order_id', $orderId)
                ->where('status', 'pending')
                ->first();
            
            if ($payment) {
                $payment->update([
                    'status' => 'cancelled',
                    'notes' => 'Payment cancelled due to order cancellation',
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully and inventory released',
                'data' => [
                    'order' => $order->load(['customer', 'items']),
                    'workflow_status' => 'order_cancelled'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Order cancellation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order: ' . $e->getMessage()
            ], 500);
        }
    }
}
