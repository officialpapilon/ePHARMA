<?php

namespace App\Http\Controllers;

use App\Models\WholesaleDelivery;
use App\Models\WholesaleOrder;
use App\Models\WholesaleCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
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
}
