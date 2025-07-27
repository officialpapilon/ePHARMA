<?php

namespace App\Http\Controllers;

use App\Models\WholesalePayment;
use App\Models\WholesaleOrder;
use App\Models\WholesaleCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WholesalePaymentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status');
            $paymentMethod = $request->input('payment_type');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = WholesalePayment::query()
                ->with(['order', 'customer', 'order.customer']);

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('payment_number', 'like', "%{$search}%")
                      ->orWhere('reference_number', 'like', "%{$search}%")
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

            if ($paymentMethod) {
                $query->where('payment_type', $paymentMethod);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('payment_date', [$startDate, $endDate]);
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $payments = $query->paginate($perPage);

            // Calculate summary statistics
            $summary = [
                'total_payments' => WholesalePayment::count(),
                'total_amount' => WholesalePayment::sum('amount'),
                'pending_payments' => WholesalePayment::where('status', 'pending')->count(),
                'completed_payments' => WholesalePayment::where('status', 'completed')->count(),
                'failed_payments' => WholesalePayment::where('status', 'failed')->count(),
                'overdue_payments' => WholesalePayment::where('status', 'pending')
                    ->where('due_date', '<', now())->count(),
                'payments_by_method' => WholesalePayment::select('payment_type', 
                    DB::raw('count(*) as count'), 
                    DB::raw('sum(amount) as amount'))
                    ->groupBy('payment_type')
                    ->get(),
                'average_payment_time' => WholesalePayment::whereNotNull('payment_date')
                    ->whereNotNull('due_date')
                    ->avg(DB::raw('DATEDIFF(payment_date, due_date)')),
            ];

            return response()->json([
                'success' => true,
                'data' => $payments->items(),
                'meta' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                    'from' => $payments->firstItem(),
                    'to' => $payments->lastItem(),
                ],
                'summary' => $summary,
                'message' => 'Payments retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payments',
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
                'payment_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:payment_date',
                'amount' => 'required|numeric|min:0',
                'payment_type' => 'required|string|max:50',
                'reference_number' => 'required|string|max:100|unique:wholesale_payments',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if payment amount exceeds order balance
            $order = WholesaleOrder::find($request->order_id);
            if ($request->amount > $order->balance_amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount cannot exceed order balance'
                ], 422);
            }

            // Generate payment number
            $lastPayment = WholesalePayment::orderBy('id', 'desc')->first();
            $paymentNumber = 'PAY' . str_pad(($lastPayment ? $lastPayment->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            $payment = WholesalePayment::create([
                'payment_number' => $paymentNumber,
                'order_id' => $request->order_id,
                'customer_id' => $request->customer_id,
                'payment_date' => $request->payment_date,
                'due_date' => $request->due_date,
                'amount' => $request->amount,
                'payment_type' => $request->payment_type,
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment->load(['order', 'customer']),
                'message' => 'Payment created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $payment = WholesalePayment::with(['order', 'customer', 'order.customer'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Payment retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'payment_date' => 'sometimes|required|date',
                'due_date' => 'sometimes|required|date',
                'amount' => 'sometimes|required|numeric|min:0',
                'payment_type' => 'sometimes|required|string|max:50',
                'reference_number' => 'sometimes|required|string|max:100|unique:wholesale_payments,reference_number,' . $id,
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $payment->update($request->only([
                'payment_date',
                'due_date',
                'amount',
                'payment_type',
                'reference_number',
                'notes',
            ]));

            return response()->json([
                'success' => true,
                'data' => $payment->load(['order', 'customer']),
                'message' => 'Payment updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);
            $payment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markCompleted($id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);
            
            if ($payment->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending payments can be marked as completed'
                ], 400);
            }

            DB::transaction(function () use ($payment) {
                $payment->update([
                    'status' => 'completed',
                    'updated_at' => now(),
                ]);

                // Update order balance
                $order = $payment->order;
                $order->update([
                    'paid_amount' => $order->paid_amount + $payment->amount,
                    'balance_amount' => $order->balance_amount - $payment->amount,
                ]);

                // Update payment status if balance is zero
                if ($order->balance_amount <= 0) {
                    $order->update(['payment_status' => 'paid']);
                } else {
                    $order->update(['payment_status' => 'partial']);
                }
            });

            return response()->json([
                'success' => true,
                'data' => $payment->load(['order', 'customer']),
                'message' => 'Payment marked as completed'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markFailed($id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);
            
            if ($payment->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending payments can be marked as failed'
                ], 400);
            }

            $payment->update([
                'status' => 'failed',
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment->load(['order', 'customer']),
                'message' => 'Payment marked as failed'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markRefunded($id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);
            
            if ($payment->status !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only completed payments can be marked as refunded'
                ], 400);
            }

            DB::transaction(function () use ($payment) {
                $payment->update([
                    'status' => 'refunded',
                    'updated_at' => now(),
                ]);

                // Update order balance
                $order = $payment->order;
                $order->update([
                    'paid_amount' => $order->paid_amount - $payment->amount,
                    'balance_amount' => $order->balance_amount + $payment->amount,
                    'payment_status' => 'partial',
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $payment->load(['order', 'customer']),
                'message' => 'Payment marked as refunded'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateReceipt($id)
    {
        try {
            $payment = WholesalePayment::with(['order', 'customer', 'order.customer'])
                ->findOrFail($id);

            // Generate receipt data
            $receipt = [
                'receipt_number' => 'RCP' . str_pad($payment->id, 6, '0', STR_PAD_LEFT),
                'payment' => $payment,
                'generated_at' => now(),
                'company_info' => [
                    'name' => 'Your Pharmacy Name',
                    'address' => 'Your Pharmacy Address',
                    'phone' => 'Your Pharmacy Phone',
                    'email' => 'Your Pharmacy Email',
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $receipt,
                'message' => 'Receipt generated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate receipt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPaymentMethods()
    {
        $methods = [
            'cash' => 'Cash',
            'bank_transfer' => 'Bank Transfer',
            'check' => 'Check',
            'credit_card' => 'Credit Card',
            'mobile_money' => 'Mobile Money',
            'online_payment' => 'Online Payment',
        ];

        return response()->json([
            'success' => true,
            'data' => $methods,
            'message' => 'Payment methods retrieved successfully'
        ]);
    }
}
