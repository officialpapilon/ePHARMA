<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\MedicinesCache;
use App\Models\PaymentApproval;
use App\Models\Dispensed;
use App\Models\Carts;
use App\Models\Customer;
use App\Models\User;
use App\Models\StockTaking;
use App\Models\Adjustment;
use App\Models\FinancialActivity;
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

            // Financial Analytics - Include both PaymentApproval and FinancialActivity
            $totalRevenue = PaymentApproval::where('status', 'approved')
                ->sum('approved_amount') + 
                FinancialActivity::where('status', 'approved')
                ->where('type', 'income')
                ->sum('amount') -
                FinancialActivity::where('status', 'approved')
                ->where('type', 'expense')
                ->sum('amount');
            
            $monthlyRevenue = PaymentApproval::where('status', 'approved')
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->sum('approved_amount') +
                FinancialActivity::where('status', 'approved')
                ->where('type', 'income')
                ->whereBetween('transaction_date', [$startOfMonth, $now])
                ->sum('amount') -
                FinancialActivity::where('status', 'approved')
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [$startOfMonth, $now])
                ->sum('amount');
            
            $weeklyRevenue = PaymentApproval::where('status', 'approved')
                ->whereBetween('created_at', [$startOfWeek, $now])
                ->sum('approved_amount') +
                FinancialActivity::where('status', 'approved')
                ->where('type', 'income')
                ->whereBetween('transaction_date', [$startOfWeek, $now])
                ->sum('amount') -
                FinancialActivity::where('status', 'approved')
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [$startOfWeek, $now])
                ->sum('amount');

            // Inventory Analytics
            $totalProducts = MedicinesCache::count();
            $lowStockProducts = MedicinesCache::where('current_quantity', '<=', 5)
                ->where('current_quantity', '>', 0)
                ->count();
            $outOfStockProducts = MedicinesCache::where('current_quantity', 0)->count();
            $totalInventoryValue = MedicinesCache::sum(DB::raw('current_quantity * CAST(product_price AS DECIMAL(10,2))'));

            // Sales Analytics - Include both PaymentApproval and FinancialActivity
            $totalSales = PaymentApproval::where('status', 'approved')->count() +
                FinancialActivity::where('status', 'approved')->count();
            $monthlySales = PaymentApproval::where('status', 'approved')
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->count() +
                FinancialActivity::where('status', 'approved')
                ->whereBetween('transaction_date', [$startOfMonth, $now])
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
                    $customerName = 'Unknown Customer';
                    try {
                        if ($sale->customer && is_object($sale->customer)) {
                            $customerName = $sale->customer->first_name . ' ' . $sale->customer->last_name;
                        } elseif ($sale->patient && is_object($sale->patient)) {
                            $customerName = $sale->patient->first_name . ' ' . $sale->patient->last_name;
                        } elseif (strpos($sale->Patient_ID, 'PASSOVER') === 0) {
                            $customerName = 'Passover Customer';
                        }
                    } catch (\Exception $e) {
                        $customerName = 'Unknown Customer';
                    }
                    
                    return [
                        'id' => (string) $sale->Payment_ID,
                        'type' => 'sale',
                        'description' => "Sale of Tsh " . number_format($sale->approved_amount) . " to " . $customerName,
                        'timestamp' => $sale->created_at->toISOString(),
                        'amount' => (float) $sale->approved_amount
                    ];
                });

            // Add financial activities to recent activities
            $recentFinancialActivities = FinancialActivity::where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($activity) {
                    $typeLabel = ucfirst($activity->type);
                    $amountPrefix = $activity->type === 'income' ? '+' : '-';
                    
                    return [
                        'id' => (string) $activity->id,
                        'type' => 'financial_activity',
                        'description' => "{$typeLabel}: {$activity->description} ({$amountPrefix}Tsh " . number_format($activity->amount) . ")",
                        'timestamp' => $activity->created_at->toISOString(),
                        'amount' => $activity->type === 'income' ? (float) $activity->amount : -(float) $activity->amount
                    ];
                });

            $recentStockActivities = collect();
            
            // Add stock taking activities
            $stockTakings = StockTaking::orderBy('created_at', 'desc')->limit(5)->get();
            foreach ($stockTakings as $taking) {
                $recentStockActivities->push([
                    'id' => (string) $taking->id,
                    'type' => 'stock_taking',
                    'description' => "Stock taking completed for " . count($taking->products ?? []) . " products",
                    'timestamp' => $taking->created_at->toISOString(),
                    'amount' => null
                ]);
            }

            // Add stock adjustments
            $adjustments = Adjustment::orderBy('created_at', 'desc')->limit(5)->get();
            foreach ($adjustments as $adjustment) {
                $recentStockActivities->push([
                    'id' => (string) $adjustment->id,
                    'type' => 'stock_adjustment',
                    'description' => ucfirst($adjustment->adjustment_type) . " adjustment of " . $adjustment->quantity_adjusted . " units",
                    'timestamp' => $adjustment->created_at->toISOString(),
                    'amount' => null
                ]);
            }

            // Merge and sort recent activities
            $recentActivities = $recentSales->toArray();
            $recentActivities = array_merge($recentActivities, $recentFinancialActivities->toArray());
            $recentActivities = array_merge($recentActivities, $recentStockActivities->toArray());
            $recentActivities = collect($recentActivities)
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
                ->whereNotNull('Product_ID')
                ->where('Product_ID', '!=', '')
                ->groupBy('Product_ID')
                ->orderBy('total_quantity', 'desc')
                ->limit(10)
                ->get()
                ->filter(function ($product) {
                    return !empty($product->product_id);
                })
                ->map(function ($product) {
                    // Get product name from medicines cache
                    $medicine = MedicinesCache::where('product_id', $product->product_id)->first();
                    return [
                        'product_id' => $product->product_id,
                        'product_name' => $medicine ? $medicine->product_name : 'Unknown Product',
                        'total_quantity' => (int) $product->total_quantity,
                        'total_revenue' => (float) $product->total_revenue
                    ];
                })
                ->values();

            // Revenue Trends (Last 7 days)
            $revenueTrends = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = $now->copy()->subDays($i);
                $dayRevenue = PaymentApproval::where('status', 'approved')
                    ->whereDate('created_at', $date)
                    ->sum('approved_amount') +
                    FinancialActivity::where('status', 'approved')
                    ->where('type', 'income')
                    ->whereDate('transaction_date', $date)
                    ->sum('amount') -
                    FinancialActivity::where('status', 'approved')
                    ->where('type', 'expense')
                    ->whereDate('transaction_date', $date)
                    ->sum('amount');
                
                $revenueTrends[] = [
                    'date' => $date->format('Y-m-d'),
                    'revenue' => $dayRevenue,
                    'sales_count' => PaymentApproval::where('status', 'approved')
                        ->whereDate('created_at', $date)
                        ->count() +
                        FinancialActivity::where('status', 'approved')
                        ->whereDate('transaction_date', $date)
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
                ->get()
                ->filter(function ($category) {
                    return !empty($category->product_category);
                })
                ->map(function ($category) {
                    return [
                        'product_category' => $category->product_category,
                        'product_count' => (int) $category->product_count,
                        'total_value' => (float) $category->total_value
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'financial' => [
                        'total_revenue' => (float) $totalRevenue,
                        'monthly_revenue' => (float) $monthlyRevenue,
                        'weekly_revenue' => (float) $weeklyRevenue,
                        'revenue_growth' => (float) $this->calculateGrowth($lastMonth->startOfMonth(), $lastMonth->endOfMonth(), $startOfMonth, $now)
                    ],
                    'inventory' => [
                        'total_products' => (int) $totalProducts,
                        'low_stock_products' => (int) $lowStockProducts,
                        'out_of_stock_products' => (int) $outOfStockProducts,
                        'total_inventory_value' => (float) $totalInventoryValue
                    ],
                    'sales' => [
                        'total_sales' => (int) $totalSales,
                        'monthly_sales' => (int) $monthlySales,
                        'total_customers' => (int) $totalCustomers,
                        'new_customers_this_month' => (int) $newCustomersThisMonth
                    ],
                    'staff' => [
                        'total_staff' => (int) $totalStaff,
                        'active_staff' => (int) $activeStaff
                    ],
                    'recent_activities' => $recentActivities->toArray(),
                    'top_selling_products' => $topSellingProducts->toArray(),
                    'revenue_trends' => $revenueTrends,
                    'category_performance' => $categoryPerformance->toArray()
                ],
                'message' => 'Management dashboard data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('ManagementDashboard error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => [
                    'timestamp' => now()->toISOString()
                ]
            ]);
            
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
