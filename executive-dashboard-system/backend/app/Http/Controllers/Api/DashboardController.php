<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Revenue;
use App\Models\InventoryItem;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function overview()
    {
        try {
            $currentMonth = Carbon::now();
            $previousMonth = Carbon::now()->subMonth();

            // Revenue calculations
            $currentMonthRevenue = Revenue::whereMonth('transaction_date', $currentMonth->month)
                ->whereYear('transaction_date', $currentMonth->year)
                ->sum('amount');

            $previousMonthRevenue = Revenue::whereMonth('transaction_date', $previousMonth->month)
                ->whereYear('transaction_date', $previousMonth->year)
                ->sum('amount');

            $revenueGrowth = $previousMonthRevenue > 0 ? 
                (($currentMonthRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100 : 0;

            // Transaction counts
            $currentMonthTransactions = Revenue::whereMonth('transaction_date', $currentMonth->month)
                ->whereYear('transaction_date', $currentMonth->year)
                ->count();

            $previousMonthTransactions = Revenue::whereMonth('transaction_date', $previousMonth->month)
                ->whereYear('transaction_date', $previousMonth->year)
                ->count();

            $transactionGrowth = $previousMonthTransactions > 0 ? 
                (($currentMonthTransactions - $previousMonthTransactions) / $previousMonthTransactions) * 100 : 0;

            // Inventory status
            $totalProducts = InventoryItem::count();
            $lowStockProducts = InventoryItem::where('status', 'low_stock')->count();
            $outOfStockProducts = InventoryItem::where('status', 'out_of_stock')->count();

            // Branch performance
            $activeBranches = Branch::where('status', 'active')->count();
            $totalBranches = Branch::count();

            // Recent activities
            $recentTransactions = Revenue::orderBy('transaction_date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'source' => $transaction->source,
                        'payment_method' => $transaction->payment_method,
                        'date' => $transaction->transaction_date->format('M d, Y'),
                        'type' => $transaction->transaction_type
                    ];
                });

            // Top performing products
            $topProducts = DB::table('sales_performance')
                ->select('product_name', DB::raw('SUM(revenue) as total_revenue'), DB::raw('COUNT(*) as transaction_count'))
                ->whereMonth('sale_date', $currentMonth->month)
                ->whereYear('sale_date', $currentMonth->year)
                ->groupBy('product_name')
                ->orderBy('total_revenue', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'revenue' => [
                        'current_month' => $currentMonthRevenue,
                        'previous_month' => $previousMonthRevenue,
                        'growth_percentage' => round($revenueGrowth, 2)
                    ],
                    'transactions' => [
                        'current_month' => $currentMonthTransactions,
                        'previous_month' => $previousMonthTransactions,
                        'growth_percentage' => round($transactionGrowth, 2)
                    ],
                    'inventory' => [
                        'total_products' => $totalProducts,
                        'low_stock' => $lowStockProducts,
                        'out_of_stock' => $outOfStockProducts,
                        'stock_health_percentage' => $totalProducts > 0 ? round((($totalProducts - $outOfStockProducts) / $totalProducts) * 100, 2) : 0
                    ],
                    'branches' => [
                        'active' => $activeBranches,
                        'total' => $totalBranches,
                        'active_percentage' => $totalBranches > 0 ? round(($activeBranches / $totalBranches) * 100, 2) : 0
                    ],
                    'recent_activities' => $recentTransactions,
                    'top_products' => $topProducts
                ],
                'message' => 'Dashboard overview retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function financialSummary()
    {
        try {
            $currentDate = Carbon::now();
            $startOfMonth = $currentDate->copy()->startOfMonth();
            $endOfMonth = $currentDate->copy()->endOfMonth();

            // Monthly revenue
            $monthlyRevenue = Revenue::whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->sum('amount');

            // Revenue by payment method
            $revenueByPaymentMethod = Revenue::whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->select('payment_method', DB::raw('SUM(amount) as total'))
                ->groupBy('payment_method')
                ->get();

            // Revenue by source
            $revenueBySource = Revenue::whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->select('source', DB::raw('SUM(amount) as total'))
                ->groupBy('source')
                ->get();

            // Average transaction value
            $avgTransactionValue = Revenue::whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->avg('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'monthly_revenue' => $monthlyRevenue,
                    'revenue_by_payment_method' => $revenueByPaymentMethod,
                    'revenue_by_source' => $revenueBySource,
                    'average_transaction_value' => round($avgTransactionValue, 2),
                    'period' => [
                        'start' => $startOfMonth->format('Y-m-d'),
                        'end' => $endOfMonth->format('Y-m-d')
                    ]
                ],
                'message' => 'Financial summary retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving financial summary: ' . $e->getMessage()
            ], 500);
        }
    }

    public function inventoryStatus()
    {
        try {
            // Overall inventory status
            $totalProducts = InventoryItem::count();
            $lowStockProducts = InventoryItem::where('status', 'low_stock')->count();
            $outOfStockProducts = InventoryItem::where('status', 'out_of_stock')->count();
            $expiringProducts = InventoryItem::where('expiry_date', '<=', Carbon::now()->addMonths(3))->count();

            // Top selling products
            $topSellingProducts = DB::table('sales_performance')
                ->select('product_name', 'quantity', 'unit_price', DB::raw('COUNT(*) as sales_count'))
                ->where('sale_date', '>=', Carbon::now()->subMonth())
                ->groupBy('product_name', 'quantity', 'unit_price')
                ->orderBy('sales_count', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'overall_status' => [
                        'total_products' => $totalProducts,
                        'low_stock' => $lowStockProducts,
                        'out_of_stock' => $outOfStockProducts,
                        'expiring_soon' => $expiringProducts
                    ],
                    'top_selling_products' => $topSellingProducts
                ],
                'message' => 'Inventory status retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving inventory status: ' . $e->getMessage()
            ], 500);
        }
    }

    public function employeeProductivity()
    {
        try {
            $currentDate = Carbon::now();
            $startOfMonth = $currentDate->copy()->startOfMonth();
            $endOfMonth = $currentDate->copy()->endOfMonth();

            // Employee performance
            $employeePerformance = Employee::where('status', 'active')
                ->select('name', 'position', 'transactions_count', 'total_sales')
                ->orderBy('total_sales', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'employee_performance' => $employeePerformance
                ],
                'message' => 'Employee productivity retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving employee productivity: ' . $e->getMessage()
            ], 500);
        }
    }

    public function alerts()
    {
        try {
            $alerts = Alert::where('is_read', false)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $alerts,
                'message' => 'Alerts retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving alerts: ' . $e->getMessage()
            ], 500);
        }
    }
} 