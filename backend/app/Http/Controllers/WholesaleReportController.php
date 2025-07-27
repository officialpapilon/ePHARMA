<?php

namespace App\Http\Controllers;

use App\Models\WholesaleOrder;
use App\Models\WholesaleCustomer;
use App\Models\WholesaleDelivery;
use App\Models\WholesalePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WholesaleReportController extends Controller
{
    public function dashboard()
    {
        try {
            // Get basic statistics
            $totalOrders = WholesaleOrder::count();
            $totalRevenue = WholesaleOrder::sum('total_amount');
            $totalPaid = WholesaleOrder::sum('paid_amount');
            $totalOutstanding = WholesaleOrder::sum('balance_amount');
            $totalCustomers = WholesaleCustomer::count();
            $activeCustomers = WholesaleCustomer::where('status', 'active')->count();
            $totalDeliveries = WholesaleDelivery::count();
            $overdueOrders = WholesaleOrder::overdue()->count();

            // Get orders by status
            $ordersByStatus = WholesaleOrder::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get();

            // Get orders by payment status
            $ordersByPaymentStatus = WholesaleOrder::select('payment_status', DB::raw('count(*) as count'))
                ->groupBy('payment_status')
                ->get();

            // Get recent orders
            $recentOrders = WholesaleOrder::with(['customer'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            // Get recent payments
            $recentPayments = WholesalePayment::with(['customer'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            $data = [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'total_paid' => $totalPaid,
                'total_outstanding' => $totalOutstanding,
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCustomers,
                'total_deliveries' => $totalDeliveries,
                'overdue_orders' => $overdueOrders,
                'orders_by_status' => $ordersByStatus,
                'orders_by_payment_status' => $ordersByPaymentStatus,
                'recent_orders' => $recentOrders,
                'recent_payments' => $recentPayments,
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Dashboard data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function sales(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth());
            $customerId = $request->input('customer_id');
            $status = $request->input('status');

            $query = WholesaleOrder::with(['customer', 'items'])
                ->whereBetween('order_date', [$startDate, $endDate]);

            if ($customerId) {
                $query->where('customer_id', $customerId);
            }

            if ($status) {
                $query->where('status', $status);
            }

            $orders = $query->orderBy('order_date', 'desc')->get();

            // Calculate summary
            $summary = [
                'total_orders' => $orders->count(),
                'total_revenue' => $orders->sum('total_amount'),
                'total_paid' => $orders->sum('paid_amount'),
                'total_outstanding' => $orders->sum('balance_amount'),
                'average_order_value' => $orders->count() > 0 ? $orders->sum('total_amount') / $orders->count() : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $orders,
                'summary' => $summary,
                'message' => 'Sales report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function customers(Request $request)
    {
        try {
            $status = $request->input('status');
            $customerType = $request->input('customer_type');

            $query = WholesaleCustomer::with(['orders', 'payments']);

            if ($status) {
                $query->where('status', $status);
            }

            if ($customerType) {
                $query->where('customer_type', $customerType);
            }

            $customers = $query->get();

            // Calculate customer statistics
            foreach ($customers as $customer) {
                $customer->total_orders = $customer->orders->count();
                $customer->total_spent = $customer->orders->sum('total_amount');
                $customer->total_paid = $customer->payments->where('status', 'completed')->sum('amount');
                $customer->outstanding_balance = $customer->current_balance;
            }

            return response()->json([
                'success' => true,
                'data' => $customers,
                'message' => 'Customer report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deliveries(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth());
            $status = $request->input('status');

            $query = WholesaleDelivery::with(['order', 'customer'])
                ->whereBetween('scheduled_date', [$startDate, $endDate]);

            if ($status) {
                $query->where('status', $status);
            }

            $deliveries = $query->orderBy('scheduled_date', 'desc')->get();

            // Calculate delivery statistics
            $summary = [
                'total_deliveries' => $deliveries->count(),
                'delivered' => $deliveries->where('status', 'delivered')->count(),
                'in_transit' => $deliveries->where('status', 'in_transit')->count(),
                'scheduled' => $deliveries->where('status', 'scheduled')->count(),
                'failed' => $deliveries->where('status', 'failed')->count(),
                'overdue' => $deliveries->where('scheduled_date', '<', Carbon::today())->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $deliveries,
                'summary' => $summary,
                'message' => 'Delivery report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve delivery report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function payments(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth());
            $status = $request->input('status');
            $paymentType = $request->input('payment_type');

            $query = WholesalePayment::with(['order', 'customer'])
                ->whereBetween('payment_date', [$startDate, $endDate]);

            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentType) {
                $query->where('payment_type', $paymentType);
            }

            $payments = $query->orderBy('payment_date', 'desc')->get();

            // Calculate payment statistics
            $summary = [
                'total_payments' => $payments->count(),
                'total_amount' => $payments->sum('amount'),
                'total_received' => $payments->sum('amount_received'),
                'completed' => $payments->where('status', 'completed')->count(),
                'pending' => $payments->where('status', 'pending')->count(),
                'failed' => $payments->where('status', 'failed')->count(),
                'refunded' => $payments->where('status', 'refunded')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $payments,
                'summary' => $summary,
                'message' => 'Payment report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payment report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function overdue()
    {
        try {
            $overdueOrders = WholesaleOrder::overdue()
                ->with(['customer'])
                ->get();

            $overduePayments = WholesalePayment::overdue()
                ->with(['customer'])
                ->get();

            $overdueDeliveries = WholesaleDelivery::overdue()
                ->with(['customer'])
                ->get();

            $data = [
                'overdue_orders' => $overdueOrders,
                'overdue_payments' => $overduePayments,
                'overdue_deliveries' => $overdueDeliveries,
                'summary' => [
                    'total_overdue_orders' => $overdueOrders->count(),
                    'total_overdue_payments' => $overduePayments->count(),
                    'total_overdue_deliveries' => $overdueDeliveries->count(),
                    'total_overdue_amount' => $overduePayments->sum('amount'),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Overdue report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve overdue report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
