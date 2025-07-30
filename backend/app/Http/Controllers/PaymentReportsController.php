<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentApproval;
use App\Models\PaymentDetails;
use App\Models\Customer;
use App\Models\User;
use App\Models\Dispensed;
use App\Models\WholesalePayment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentReportsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status');
            $paymentMethod = $request->input('payment_method');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            // Primary query using payment_approval table (unified source)
            $query = PaymentApproval::with(['customer', 'cart', 'creator', 'approver'])
                ->select([
                    'Payment_ID as id',
                    'dispense_id',
                    'Patient_ID as customer_id',
                    'transaction_ID',
                    'approved_amount as total_amount',
                    'approved_payment_method as payment_method',
                    'status',
                    'approved_at',
                    'created_at',
                    'updated_at',
                    'created_by',
                    'approved_by'
                ]);

            // Apply filters
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('dispense_id', 'like', "%{$search}%")
                      ->orWhere('transaction_ID', 'like', "%{$search}%")
                      ->orWhere('Patient_ID', 'like', "%{$search}%");
                });
            }

            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentMethod) {
                $query->where('approved_payment_method', $paymentMethod);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('approved_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }

            // Apply sorting and pagination
            $payments = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            // Transform the data to include customer info and transaction type
            $transformedData = $payments->getCollection()->map(function ($payment) {
                // Determine transaction type based on dispense_id pattern
                $transactionType = 'complex_dispensing';
                if (str_starts_with($payment->transaction_ID, 'SIMPLE-')) {
                    $transactionType = 'simple_dispensing';
                } elseif (str_starts_with($payment->dispense_id, 'WHOLESALE-')) {
                    $transactionType = 'wholesale';
                }

                // Get customer info - match DispensingReportsController approach
                $customerName = 'Passover Customer';
                $customerPhone = 'N/A';
                $customer = null;
                
                if ($payment->customer_id !== 'PASSOVER-CUSTOMER') {
                    $customer = \App\Models\Patients::find($payment->customer_id);
                    if ($customer) {
                        $customerName = $customer->first_name && $customer->last_name 
                            ? $customer->first_name . ' ' . $customer->last_name
                            : ($customer->name || 'Unknown Customer');
                        $customerPhone = $customer->phone || 'N/A';
                    }
                }

                // Get approved by name
                $approvedByName = 'Unknown';
                if ($payment->approved_by) {
                    $user = \App\Models\User::find($payment->approved_by);
                    $approvedByName = $user ? ($user->first_name . ' ' . $user->last_name) : 'Unknown';
                }

                return [
                    'id' => $payment->id,
                    'dispense_id' => $payment->dispense_id,
                    'customer_id' => $payment->customer_id,
                    'total_amount' => $payment->total_amount,
                    'payment_method' => $payment->payment_method,
                    'status' => $payment->status,
                    'approved_at' => $payment->approved_at,
                    'created_at' => $payment->created_at,
                    'updated_at' => $payment->updated_at,
                    'transaction_type' => $transactionType,
                    'patient_name' => $customerName,
                    'patient_phone' => $customerPhone,
                    'created_by' => $payment->created_by,
                    'approved_by' => $payment->approved_by,
                    'approved_by_name' => $approvedByName
                ];
            });

            $payments->setCollection($transformedData);

            // Calculate summary statistics from payment_approval table
            $summaryQuery = PaymentApproval::query();
            
            if ($startDate && $endDate) {
                $summaryQuery->whereBetween('approved_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }

            $summary = [
                'total_payments' => $summaryQuery->count(),
                'total_revenue' => $summaryQuery->where('status', 'Paid')->sum('approved_amount'),
                'pending_payments' => $summaryQuery->where('status', 'Pending')->count(),
                'approved_payments' => $summaryQuery->where('status', 'Paid')->count(),
                'rejected_payments' => $summaryQuery->where('status', 'Rejected')->count(),
                'payment_methods' => $summaryQuery->select('approved_payment_method')
                    ->distinct()
                    ->pluck('approved_payment_method')
                    ->filter()
                    ->values()
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
                'message' => 'Payment report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function revenueAnalytics(Request $request)
    {
        try {
            $period = $request->input('period', 'monthly'); // daily, weekly, monthly, yearly
            $startDate = $request->input('start_date', Carbon::now()->subYear()->format('Y-m-d'));
            $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

            $query = PaymentApproval::where('status', 'Paid')
                ->whereBetween('approved_at', [$startDate, $endDate]);

            switch ($period) {
                case 'daily':
                    $revenueData = $query->select(
                        DB::raw('DATE(approved_at) as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                case 'weekly':
                    $revenueData = $query->select(
                        DB::raw('YEARWEEK(approved_at) as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                case 'monthly':
                    $revenueData = $query->select(
                        DB::raw('DATE_FORMAT(approved_at, "%Y-%m") as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                case 'yearly':
                    $revenueData = $query->select(
                        DB::raw('YEAR(approved_at) as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                default:
                    $revenueData = collect();
            }

            // Payment method breakdown from payment_approval
            $paymentMethodBreakdown = PaymentApproval::where('status', 'Paid')
                ->whereBetween('approved_at', [$startDate, $endDate])
                ->select('approved_payment_method')
                ->selectRaw('SUM(approved_amount) as total_amount')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('approved_payment_method')
                ->get();

            // Top customers from payment_approval
            $topCustomers = PaymentApproval::with('customer')
                ->where('status', 'Paid')
                ->whereBetween('approved_at', [$startDate, $endDate])
                ->select('Patient_ID')
                ->selectRaw('SUM(approved_amount) as total_spent')
                ->selectRaw('COUNT(*) as transaction_count')
                ->groupBy('Patient_ID')
                ->orderBy('total_spent', 'desc')
                ->limit(10)
                ->get();

            $summary = [
                'total_revenue' => $revenueData->sum('revenue'),
                'total_transactions' => $revenueData->sum('transactions'),
                'average_transaction_value' => $revenueData->sum('transactions') > 0 ? 
                    $revenueData->sum('revenue') / $revenueData->sum('transactions') : 0,
                'peak_period' => $revenueData->sortByDesc('revenue')->first(),
                'growth_rate' => $this->calculateGrowthRate($revenueData)
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'revenue_trends' => $revenueData,
                    'payment_method_breakdown' => $paymentMethodBreakdown,
                    'top_customers' => $topCustomers
                ],
                'summary' => $summary,
                'message' => 'Revenue analytics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch revenue analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function customerPaymentHistory(Request $request)
    {
        try {
            $customerId = $request->input('customer_id');
            $perPage = $request->input('per_page', 15);

            if (!$customerId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer ID is required'
                ], 400);
            }

            $payments = PaymentApproval::with(['cart'])
                ->where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            $customer = Customer::find($customerId);

            $summary = [
                'customer_name' => $customer->name ?? 'Unknown',
                'total_spent' => PaymentApproval::where('customer_id', $customerId)
                    ->where('status', 'approved')
                    ->sum('total_amount'),
                'total_transactions' => PaymentApproval::where('customer_id', $customerId)
                    ->where('status', 'approved')
                    ->count(),
                'average_transaction' => PaymentApproval::where('customer_id', $customerId)
                    ->where('status', 'approved')
                    ->avg('total_amount'),
                'last_transaction' => PaymentApproval::where('customer_id', $customerId)
                    ->where('status', 'approved')
                    ->latest()
                    ->first()
            ];

            return response()->json([
                'success' => true,
                'data' => $payments->items(),
                'meta' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                ],
                'summary' => $summary,
                'message' => 'Customer payment history retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customer payment history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function calculateGrowthRate($revenueData)
    {
        if ($revenueData->count() < 2) {
            return 0;
        }

        $sortedData = $revenueData->sortBy('period')->values();
        $firstPeriod = $sortedData->first();
        $lastPeriod = $sortedData->last();

        if ($firstPeriod->revenue == 0) {
            return $lastPeriod->revenue > 0 ? 100 : 0;
        }

        return round((($lastPeriod->revenue - $firstPeriod->revenue) / $firstPeriod->revenue) * 100, 2);
    }
}
