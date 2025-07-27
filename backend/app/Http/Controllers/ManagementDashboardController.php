<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MedicinesCache;
use App\Models\PaymentApproval;
use App\Models\Dispensed;
use App\Models\Carts;
use App\Models\Customer;
use App\Models\User;
use App\Models\StockTaking;
use App\Models\Adjustment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ManagementDashboardController extends Controller
{
    public function index()
    {
        try {
            // Get current date and date ranges
            $now = Carbon::now();
            $startOfMonth = $now->copy()->startOfMonth();
            $startOfWeek = $now->copy()->startOfWeek();
            $lastMonth = $now->copy()->subMonth();

            // Financial Analytics
            $totalRevenue = PaymentApproval::where('status', 'approved')
                ->sum('approved_amount');
            
            $monthlyRevenue = PaymentApproval::where('status', 'approved')
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->sum('approved_amount');
            
            $weeklyRevenue = PaymentApproval::where('status', 'approved')
                ->whereBetween('created_at', [$startOfWeek, $now])
                ->sum('approved_amount');

            // Inventory Analytics
            $totalProducts = MedicinesCache::count();
            $lowStockProducts = MedicinesCache::where('current_quantity', '<=', 5)
                ->where('current_quantity', '>', 0)
                ->count();
            $outOfStockProducts = MedicinesCache::where('current_quantity', 0)->count();
            $totalInventoryValue = MedicinesCache::sum(DB::raw('current_quantity * CAST(product_price AS DECIMAL(10,2))'));

            // Sales Analytics
            $totalSales = PaymentApproval::where('status', 'approved')->count();
            $monthlySales = PaymentApproval::where('status', 'approved')
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->count();
            
            $totalCustomers = Customer::count();
            $newCustomersThisMonth = Customer::whereBetween('created_at', [$startOfMonth, $now])->count();

            // Staff Analytics
            $totalStaff = User::count();
            $activeStaff = User::where('status', 'active')->count();

            // Recent Activities
            $recentSales = PaymentApproval::with('customer')
                ->where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($sale) {
                    return [
                        'id' => $sale->Payment_ID,
                        'type' => 'sale',
                        'description' => "Sale of Tsh " . number_format($sale->approved_amount) . " to " . ($sale->customer->name ?? 'Customer'),
                        'timestamp' => $sale->created_at,
                        'amount' => $sale->approved_amount
                    ];
                });

            $recentStockActivities = collect();
            
            // Add stock taking activities
            $stockTakings = StockTaking::orderBy('created_at', 'desc')->limit(5)->get();
            foreach ($stockTakings as $taking) {
                $recentStockActivities->push([
                    'id' => $taking->id,
                    'type' => 'stock_taking',
                    'description' => "Stock taking completed for " . count($taking->products ?? []) . " products",
                    'timestamp' => $taking->created_at,
                    'amount' => null
                ]);
            }

            // Add stock adjustments
            $adjustments = Adjustment::orderBy('created_at', 'desc')->limit(5)->get();
            foreach ($adjustments as $adjustment) {
                $recentStockActivities->push([
                    'id' => $adjustment->id,
                    'type' => 'stock_adjustment',
                    'description' => ucfirst($adjustment->adjustment_type) . " adjustment of " . $adjustment->quantity_adjusted . " units",
                    'timestamp' => $adjustment->created_at,
                    'amount' => null
                ]);
            }

            // Merge and sort recent activities
            $recentActivities = $recentSales->merge($recentStockActivities)
                ->sortByDesc('timestamp')
                ->take(10)
                ->values();

            // Top Selling Products
            $topSellingProducts = DB::table('payment_approval')
                ->select(
                    'Product_ID as product_id',
                    DB::raw('COUNT(*) as total_quantity'),
                    DB::raw('SUM(approved_amount) as total_revenue')
                )
                ->where('status', 'approved')
                ->groupBy('Product_ID')
                ->orderBy('total_quantity', 'desc')
                ->limit(10)
                ->get();

            // Revenue Trends (Last 7 days)
            $revenueTrends = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = $now->copy()->subDays($i);
                $dayRevenue = PaymentApproval::where('status', 'approved')
                    ->whereDate('created_at', $date)
                    ->sum('approved_amount');
                
                $revenueTrends[] = [
                    'date' => $date->format('Y-m-d'),
                    'revenue' => $dayRevenue,
                    'sales_count' => PaymentApproval::where('status', 'approved')
                        ->whereDate('created_at', $date)
                        ->count()
                ];
            }

            // Category Performance
            $categoryPerformance = MedicinesCache::select('product_category')
                ->selectRaw('COUNT(*) as product_count')
                ->selectRaw('SUM(current_quantity * CAST(product_price AS DECIMAL(10,2))) as total_value')
                ->groupBy('product_category')
                ->orderBy('total_value', 'desc')
                ->limit(8)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'financial' => [
                        'total_revenue' => $totalRevenue,
                        'monthly_revenue' => $monthlyRevenue,
                        'weekly_revenue' => $weeklyRevenue,
                        'revenue_growth' => $this->calculateGrowth($lastMonth->startOfMonth(), $lastMonth->endOfMonth(), $startOfMonth, $now)
                    ],
                    'inventory' => [
                        'total_products' => $totalProducts,
                        'low_stock_products' => $lowStockProducts,
                        'out_of_stock_products' => $outOfStockProducts,
                        'total_inventory_value' => $totalInventoryValue
                    ],
                    'sales' => [
                        'total_sales' => $totalSales,
                        'monthly_sales' => $monthlySales,
                        'total_customers' => $totalCustomers,
                        'new_customers_this_month' => $newCustomersThisMonth
                    ],
                    'staff' => [
                        'total_staff' => $totalStaff,
                        'active_staff' => $activeStaff
                    ],
                    'recent_activities' => $recentActivities,
                    'top_selling_products' => $topSellingProducts,
                    'revenue_trends' => $revenueTrends,
                    'category_performance' => $categoryPerformance
                ],
                'message' => 'Management dashboard data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch management dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function calculateGrowth($lastStart, $lastEnd, $currentStart, $currentEnd)
    {
        $lastPeriodRevenue = PaymentApproval::where('status', 'approved')
            ->whereBetween('created_at', [$lastStart, $lastEnd])
            ->sum('approved_amount');
        
        $currentPeriodRevenue = PaymentApproval::where('status', 'approved')
            ->whereBetween('created_at', [$currentStart, $currentEnd])
            ->sum('approved_amount');
        
        if ($lastPeriodRevenue == 0) {
            return $currentPeriodRevenue > 0 ? 100 : 0;
        }
        
        return round((($currentPeriodRevenue - $lastPeriodRevenue) / $lastPeriodRevenue) * 100, 2);
    }
}
