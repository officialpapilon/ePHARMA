<?php

namespace App\Http\Controllers;

use App\Models\WholesaleOrder;
use App\Models\WholesalePayment;
use App\Models\WholesaleDelivery;
use App\Models\WholesaleCustomer;
use App\Models\MedicinesCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class WholesaleReportController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function dashboard()
    {
        try {
            $today = Carbon::today();
            $thisMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();

            // Order statistics
            $totalOrders = WholesaleOrder::count();
            $pendingOrders = WholesaleOrder::where('status', 'pending_payment')->count();
            $confirmedOrders = WholesaleOrder::where('status', 'confirmed')->count();
            $processingOrders = WholesaleOrder::where('status', 'processing')->count();
            $readyForDelivery = WholesaleOrder::where('status', 'ready_for_delivery')->count();
            $deliveredOrders = WholesaleOrder::where('status', 'delivered')->count();

            // Revenue statistics
            $totalRevenue = WholesaleOrder::sum('total_amount');
            $totalPaid = WholesaleOrder::where('payment_status', 'paid')->sum('paid_amount');
            $totalOutstanding = WholesaleOrder::where('payment_status', '!=', 'paid')->sum('balance_amount');

            // Payment statistics
            $pendingPayments = WholesalePayment::where('status', 'pending')->count();

            // Delivery statistics
            $pendingDeliveries = WholesaleOrder::whereIn('status', ['ready_for_delivery', 'assigned_to_delivery'])->count();

            // Overdue orders
            $overdueOrders = WholesaleOrder::where('due_date', '<', $today)
                ->where('payment_status', '!=', 'paid')
                ->count();

            // Customer statistics
            $totalCustomers = WholesaleCustomer::where('status', 'active')->count();

            // Low stock items
            $lowStockItems = MedicinesCache::where('current_quantity', '<', 10)->count();

            // Top customers
            $topCustomers = WholesaleOrder::select(
                'wholesale_customers.business_name',
                DB::raw('COUNT(wholesale_orders.id) as total_orders'),
                DB::raw('SUM(wholesale_orders.total_amount) as total_revenue')
            )
            ->join('wholesale_customers', 'wholesale_orders.customer_id', '=', 'wholesale_customers.id')
            ->groupBy('wholesale_customers.id', 'wholesale_customers.business_name')
            ->orderBy('total_revenue', 'desc')
            ->limit(5)
            ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => $totalOrders,
                    'pending_orders' => $pendingOrders,
                    'confirmed_orders' => $confirmedOrders,
                    'processing_orders' => $processingOrders,
                    'ready_for_delivery' => $readyForDelivery,
                    'delivered_orders' => $deliveredOrders,
                    'total_revenue' => $totalRevenue,
                    'total_paid' => $totalPaid,
                    'total_outstanding' => $totalOutstanding,
                    'pending_payments' => $pendingPayments,
                    'pending_deliveries' => $pendingDeliveries,
                    'overdue_orders' => $overdueOrders,
                    'total_customers' => $totalCustomers,
                    'low_stock_items' => $lowStockItems,
                    'top_customers' => $topCustomers,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics'
            ], 500);
        }
    }

    /**
     * Get orders report
     */
    public function orders(Request $request)
    {
        try {
            $query = WholesaleOrder::with(['customer', 'items']);

            // Apply date filters
            if ($request->filled('start_date')) {
                $query->where('created_at', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
            }

            // Apply status filter
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $orders = $query->orderBy('created_at', 'desc')->get();

            // Calculate summary
            $summary = [
                'total_orders' => $orders->count(),
                'total_revenue' => $orders->sum('total_amount'),
                'total_payments' => WholesalePayment::count(),
                'total_deliveries' => WholesaleDelivery::count(),
                'average_order_value' => $orders->count() > 0 ? $orders->sum('total_amount') / $orders->count() : 0,
                'top_customers' => $orders->groupBy('customer_id')
                    ->map(function ($customerOrders) {
                        return [
                            'customer_name' => $customerOrders->first()->customer->business_name,
                            'total_orders' => $customerOrders->count(),
                            'total_revenue' => $customerOrders->sum('total_amount'),
                        ];
                    })
                    ->sortByDesc('total_revenue')
                    ->take(5)
                    ->values()
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'orders' => $orders,
                    'summary' => $summary
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Orders report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate orders report'
            ], 500);
        }
    }

    /**
     * Get payments report
     */
    public function payments(Request $request)
    {
        try {
            $query = WholesalePayment::with(['order', 'customer']);

            // Apply date filters
            if ($request->filled('start_date')) {
                $query->where('payment_date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->where('payment_date', '<=', $request->end_date . ' 23:59:59');
            }

            // Apply status filter
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $payments = $query->orderBy('payment_date', 'desc')->get();

            // Calculate summary
            $summary = [
                'total_orders' => WholesaleOrder::count(),
                'total_revenue' => WholesaleOrder::sum('total_amount'),
                'total_payments' => $payments->count(),
                'total_deliveries' => WholesaleDelivery::count(),
                'average_order_value' => WholesaleOrder::count() > 0 ? WholesaleOrder::sum('total_amount') / WholesaleOrder::count() : 0,
                'top_customers' => WholesaleOrder::with('customer')
                    ->groupBy('customer_id')
                    ->select('customer_id', DB::raw('COUNT(*) as total_orders'), DB::raw('SUM(total_amount) as total_revenue'))
                    ->orderBy('total_revenue', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function ($order) {
                        return [
                            'customer_name' => $order->customer->business_name,
                            'total_orders' => $order->total_orders,
                            'total_revenue' => $order->total_revenue,
                        ];
                    })
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'payments' => $payments,
                    'summary' => $summary
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Payments report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate payments report'
            ], 500);
        }
    }

    /**
     * Get deliveries report
     */
    public function deliveries(Request $request)
    {
        try {
            $query = WholesaleDelivery::with(['order', 'customer']);

            // Apply date filters
            if ($request->filled('start_date')) {
                $query->where('delivery_date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->where('delivery_date', '<=', $request->end_date . ' 23:59:59');
            }

            // Apply status filter
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $deliveries = $query->orderBy('delivery_date', 'desc')->get();

            // Calculate summary
            $summary = [
                'total_orders' => WholesaleOrder::count(),
                'total_revenue' => WholesaleOrder::sum('total_amount'),
                'total_payments' => WholesalePayment::count(),
                'total_deliveries' => $deliveries->count(),
                'average_order_value' => WholesaleOrder::count() > 0 ? WholesaleOrder::sum('total_amount') / WholesaleOrder::count() : 0,
                'top_customers' => WholesaleOrder::with('customer')
                    ->groupBy('customer_id')
                    ->select('customer_id', DB::raw('COUNT(*) as total_orders'), DB::raw('SUM(total_amount) as total_revenue'))
                    ->orderBy('total_revenue', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function ($order) {
                        return [
                            'customer_name' => $order->customer->business_name,
                            'total_orders' => $order->total_orders,
                            'total_revenue' => $order->total_revenue,
                        ];
                    })
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'deliveries' => $deliveries,
                    'summary' => $summary
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Deliveries report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate deliveries report'
            ], 500);
        }
    }

    /**
     * Get top products report
     */
    public function topProducts()
    {
        try {
            $topProducts = WholesaleOrder::join('wholesale_order_items', 'wholesale_orders.id', '=', 'wholesale_order_items.order_id')
                ->select(
                    'wholesale_order_items.product_name',
                    'wholesale_order_items.product_category',
                    DB::raw('SUM(wholesale_order_items.quantity_ordered) as total_quantity'),
                    DB::raw('SUM(wholesale_order_items.total) as total_revenue')
                )
                ->groupBy('wholesale_order_items.product_name', 'wholesale_order_items.product_category')
                ->orderBy('total_revenue', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $topProducts
            ]);

        } catch (\Exception $e) {
            Log::error('Top products report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate top products report'
            ], 500);
        }
    }
}
