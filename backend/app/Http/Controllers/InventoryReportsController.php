<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MedicinesCache;
use App\Models\StockTaking;
use App\Models\Adjustment;
use App\Models\Dispensed;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryReportsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $category = $request->input('category');
            $stockStatus = $request->input('stock_status'); // low, out, normal
            $sortBy = $request->input('sort_by', 'product_name');
            $sortOrder = $request->input('sort_order', 'asc');

            $query = MedicinesCache::query()
                ->select([
                    'id',
                    'product_id',
                    'batch_no',
                    'product_name',
                    'product_price',
                    'buying_price',
                    'product_category',
                    'expire_date',
                    'current_quantity',
                    'created_at',
                    'updated_at'
                ]);

            // Apply filters
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('product_name', 'like', "%{$search}%")
                      ->orWhere('product_category', 'like', "%{$search}%")
                      ->orWhere('batch_no', 'like', "%{$search}%");
                });
            }

            if ($category) {
                $query->where('product_category', $category);
            }

            if ($stockStatus) {
                switch ($stockStatus) {
                    case 'low':
                        $query->where('current_quantity', '<=', 5)->where('current_quantity', '>', 0);
                        break;
                    case 'out':
                        $query->where('current_quantity', 0);
                        break;
                    case 'normal':
                        $query->where('current_quantity', '>', 5);
                        break;
                }
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $inventory = $query->paginate($perPage);

            // Calculate summary statistics
            $summary = [
                'total_products' => MedicinesCache::count(),
                'total_value' => MedicinesCache::sum(DB::raw('current_quantity * CAST(product_price AS DECIMAL(10,2))')),
                'low_stock_count' => MedicinesCache::where('current_quantity', '<=', 5)->where('current_quantity', '>', 0)->count(),
                'out_of_stock_count' => MedicinesCache::where('current_quantity', 0)->count(),
                'expiring_soon_count' => MedicinesCache::where('expire_date', '<=', Carbon::now()->addDays(30))->where('current_quantity', '>', 0)->count(),
                'categories' => MedicinesCache::select('product_category')->distinct()->pluck('product_category')
            ];

            return response()->json([
                'success' => true,
                'data' => $inventory->items(),
                'meta' => [
                    'current_page' => $inventory->currentPage(),
                    'last_page' => $inventory->lastPage(),
                    'per_page' => $inventory->perPage(),
                    'total' => $inventory->total(),
                    'from' => $inventory->firstItem(),
                    'to' => $inventory->lastItem(),
                ],
                'summary' => $summary,
                'message' => 'Inventory report retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stockMovements(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->subMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
            $productId = $request->input('product_id');

            $query = Adjustment::query()
                ->select([
                    'id',
                    'product_id',
                    'batch_no',
                    'adjustment_date',
                    'adjustment_type',
                    'quantity_adjusted',
                    'reason',
                    'created_by',
                    'created_at'
                ])
                ->whereBetween('adjustment_date', [$startDate, $endDate]);

            if ($productId) {
                $query->where('product_id', $productId);
            }

            $movements = $query->orderBy('adjustment_date', 'desc')->get();

            // Calculate movement summary
            $summary = [
                'total_increases' => $movements->where('adjustment_type', 'increase')->sum('quantity_adjusted'),
                'total_decreases' => $movements->where('adjustment_type', 'decrease')->sum('quantity_adjusted'),
                'total_transfers' => $movements->where('adjustment_type', 'transfer')->sum('quantity_adjusted'),
                'total_donations' => $movements->where('adjustment_type', 'donation')->sum('quantity_adjusted'),
                'movement_count' => $movements->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $movements,
                'summary' => $summary,
                'message' => 'Stock movements retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock movements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function expiringProducts(Request $request)
    {
        try {
            $days = $request->input('days', 30);
            $perPage = $request->input('per_page', 15);

            $expiringDate = Carbon::now()->addDays($days);

            $query = MedicinesCache::where('expire_date', '<=', $expiringDate)
                ->where('current_quantity', '>', 0)
                ->orderBy('expire_date', 'asc');

            $expiringProducts = $query->paginate($perPage);

            $summary = [
                'total_expiring' => MedicinesCache::where('expire_date', '<=', $expiringDate)->where('current_quantity', '>', 0)->count(),
                'total_value' => MedicinesCache::where('expire_date', '<=', $expiringDate)
                    ->where('current_quantity', '>', 0)
                    ->sum(DB::raw('current_quantity * CAST(product_price AS DECIMAL(10,2))')),
                'expiring_this_week' => MedicinesCache::where('expire_date', '<=', Carbon::now()->addWeek())->where('current_quantity', '>', 0)->count(),
                'expiring_this_month' => MedicinesCache::where('expire_date', '<=', Carbon::now()->addMonth())->where('current_quantity', '>', 0)->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $expiringProducts->items(),
                'meta' => [
                    'current_page' => $expiringProducts->currentPage(),
                    'last_page' => $expiringProducts->lastPage(),
                    'per_page' => $expiringProducts->perPage(),
                    'total' => $expiringProducts->total(),
                ],
                'summary' => $summary,
                'message' => 'Expiring products retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expiring products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function profitAnalysis(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->subMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

            // Get products with buying price
            $products = MedicinesCache::whereNotNull('buying_price')
                ->where('buying_price', '>', 0)
                ->get();

            $profitAnalysis = [];

            foreach ($products as $product) {
                // Calculate sold quantity from dispensing
                $soldQuantity = Dispensed::where('product_purchased', 'like', '%"' . $product->product_id . '"%')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->sum('product_quantity');

                if ($soldQuantity > 0) {
                    $revenue = $soldQuantity * $product->product_price;
                    $cost = $soldQuantity * $product->buying_price;
                    $profit = $revenue - $cost;
                    $profitMargin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;

                    $profitAnalysis[] = [
                        'product_id' => $product->product_id,
                        'product_name' => $product->product_name,
                        'batch_no' => $product->batch_no,
                        'sold_quantity' => $soldQuantity,
                        'buying_price' => $product->buying_price,
                        'selling_price' => $product->product_price,
                        'revenue' => $revenue,
                        'cost' => $cost,
                        'profit' => $profit,
                        'profit_margin' => round($profitMargin, 2)
                    ];
                }
            }

            // Sort by profit
            usort($profitAnalysis, function($a, $b) {
                return $b['profit'] <=> $a['profit'];
            });

            $summary = [
                'total_revenue' => collect($profitAnalysis)->sum('revenue'),
                'total_cost' => collect($profitAnalysis)->sum('cost'),
                'total_profit' => collect($profitAnalysis)->sum('profit'),
                'average_profit_margin' => collect($profitAnalysis)->avg('profit_margin'),
                'top_performing_product' => collect($profitAnalysis)->first(),
                'products_analyzed' => count($profitAnalysis)
            ];

            return response()->json([
                'success' => true,
                'data' => $profitAnalysis,
                'summary' => $summary,
                'message' => 'Profit analysis retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch profit analysis',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
