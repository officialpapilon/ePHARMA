<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentApproval;
use App\Models\PaymentDetails;
use App\Models\Customer;
use App\Models\User;
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

            $query = PaymentApproval::with(['customer', 'cart'])
                ->select([
                    'Payment_ID as id',
                    'dispense_id',
                    'Patient_ID as customer_id',
                    'approved_amount as total_amount',
                    'approved_payment_method as payment_method',
                    'status',
                    'approved_at',
                    'created_at',
                    'updated_at'
                ]);

            // Apply filters
            if ($search) {
                $query->whereHas('customer', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('approved_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $payments = $query->paginate($perPage);

            // Calculate summary statistics with the same filters
            $summaryQuery = PaymentApproval::query();
            
            if ($startDate && $endDate) {
                $summaryQuery->whereBetween('approved_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }

            $summary = [
                'total_payments' => $summaryQuery->count(),
                'total_revenue' => $summaryQuery->clone()->where('status', 'Paid')->sum('approved_amount'),
                'pending_payments' => $summaryQuery->clone()->where('status', 'Pending')->count(),
                'approved_payments' => $summaryQuery->clone()->where('status', 'Paid')->count(),
                'rejected_payments' => $summaryQuery->clone()->where('status', 'Rejected')->count(),
                'payment_methods' => PaymentApproval::select('approved_payment_method')->distinct()->pluck('approved_payment_method')
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
                ->whereBetween('created_at', [$startDate, $endDate]);

            switch ($period) {
                case 'daily':
                    $revenueData = $query->select(
                        DB::raw('DATE(created_at) as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                case 'weekly':
                    $revenueData = $query->select(
                        DB::raw('YEARWEEK(created_at) as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                case 'monthly':
                    $revenueData = $query->select(
                        DB::raw('DATE_FORMAT(created_at, "%Y-%m") as period'),
                        DB::raw('SUM(approved_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;

                case 'yearly':
                    $revenueData = $query->select(
                        DB::raw('YEAR(created_at) as period'),
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

            // Payment method breakdown
            $paymentMethodBreakdown = PaymentApproval::where('status', 'Paid')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->select('approved_payment_method')
                ->selectRaw('SUM(approved_amount) as total_amount')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('approved_payment_method')
                ->get();

            // Top customers
            $topCustomers = PaymentApproval::with('customer')
                ->where('status', 'Paid')
                ->whereBetween('created_at', [$startDate, $endDate])
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
