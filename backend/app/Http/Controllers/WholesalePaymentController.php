<?php

namespace App\Http\Controllers;

use App\Models\WholesalePayment;
use App\Models\WholesaleOrder;
use App\Models\WholesaleCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

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

    /**
     * Mark payment as completed
     */
    public function markCompleted(Request $request, $id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);
            
                $payment->update([
                    'status' => 'completed',
                'amount_received' => $payment->amount,
                ]);

            // Update order payment status
            if ($payment->order) {
                $order = $payment->order;
                $totalPaid = $order->payments()->where('status', 'completed')->sum('amount');
                $balance = $order->total_amount - $totalPaid;
                
                $order->update([
                    'paid_amount' => $totalPaid,
                    'balance_amount' => $balance,
                    'payment_status' => $balance <= 0 ? 'paid' : 'partial',
                ]);
                }

            return response()->json([
                'success' => true,
                'message' => 'Payment marked as completed',
                'data' => $payment->load(['order', 'customer'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark payment as completed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark payment as failed
     */
    public function markFailed(Request $request, $id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);

            $payment->update([
                'status' => 'failed',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment marked as failed',
                'data' => $payment->load(['order', 'customer'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark payment as failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark payment as refunded
     */
    public function markRefunded(Request $request, $id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);
            
                $payment->update([
                    'status' => 'refunded',
                ]);

            // Update order payment status
            if ($payment->order) {
                $order = $payment->order;
                $totalPaid = $order->payments()->where('status', 'completed')->sum('amount');
                $balance = $order->total_amount - $totalPaid;
                
                $order->update([
                    'paid_amount' => $totalPaid,
                    'balance_amount' => $balance,
                    'payment_status' => $balance <= 0 ? 'paid' : 'partial',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment marked as refunded',
                'data' => $payment->load(['order', 'customer'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark payment as refunded: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate receipt for a payment
     */
    public function generateReceipt(Request $request, $id)
    {
        try {
            $payment = WholesalePayment::findOrFail($id);

            // Generate receipt number
            $receiptNumber = 'RCP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            $payment->update([
                'receipt_number' => $receiptNumber,
                'is_receipt_generated' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Receipt generated successfully',
                'data' => [
                    'receipt_number' => $receiptNumber,
                    'payment' => $payment->load(['order', 'customer'])
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate receipt: ' . $e->getMessage()
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

    /**
     * Process manual payment for an existing order
     */
    public function processPayment(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'payment_method' => 'required|in:cash,mobile_money,card',
                'amount' => 'required|numeric|min:0',
                'reference_number' => 'required|string|max:100',
                'notes' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            $order = WholesaleOrder::findOrFail($orderId);
            
            if ($order->status !== 'pending_payment') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order is not in payment pending status'
                ], 400);
            }

            // Find the pending payment for this order
            $payment = WholesalePayment::where('order_id', $orderId)
                ->where('status', 'pending')
                ->first();

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'message' => 'No pending payment found for this order'
                ], 400);
            }

            // Update payment with actual payment details
            $payment->update([
                'payment_type' => $validated['payment_method'],
                'status' => 'completed',
                'amount_received' => $validated['amount'],
                'reference_number' => $validated['reference_number'],
                'notes' => $validated['notes'] ?? 'Manual payment processed successfully',
            ]);

            // Update order status
            $order->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'paid_amount' => $validated['amount'],
                'balance_amount' => $order->total_amount - $validated['amount'],
                'payment_method' => $validated['payment_method'],
            ]);

            // Deduct inventory after successful payment
            $order->deductInventory();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment processed successfully and inventory deducted',
                'data' => [
                    'order' => $order->load(['customer', 'items']),
                    'payment' => $payment,
                    'next_step' => 'order_fulfillment',
                    'workflow_status' => 'ready_for_fulfillment'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Payment processing error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process payment: ' . $e->getMessage()
            ], 500);
        }
    }
}
