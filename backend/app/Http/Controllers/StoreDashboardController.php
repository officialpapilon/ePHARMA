<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MedicinesCache;
use App\Models\StockAdjustment;
use App\Models\StockTaking;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StoreDashboardController extends Controller
{
    public function index()
    {
        try {
            // Get medicines cache data
            $medicines = MedicinesCache::all();
            
            // Calculate dashboard metrics
            $totalItems = $medicines->count();
            $totalValue = $medicines->sum(function($medicine) {
                return $medicine->current_quantity * floatval($medicine->product_price);
            });
            
            $lowStockItems = $medicines->filter(function($medicine) {
                return $medicine->current_quantity <= 10 && $medicine->current_quantity > 0;
            })->count();
            
            $outOfStockItems = $medicines->filter(function($medicine) {
                return $medicine->current_quantity === 0;
            })->count();
            
            $expiringItems = $medicines->filter(function($medicine) {
                $expiryDate = Carbon::parse($medicine->expire_date);
                $threeMonthsFromNow = Carbon::now()->addMonths(3);
                return $expiryDate <= $threeMonthsFromNow && $medicine->current_quantity > 0;
            })->count();
            
            // Stock status percentages
            $inStock = $medicines->filter(function($medicine) {
                return $medicine->current_quantity > 20;
            })->count();
            
            $lowStock = $medicines->filter(function($medicine) {
                return $medicine->current_quantity <= 20 && $medicine->current_quantity > 0;
            })->count();
            
            $total = $inStock + $lowStock + $outOfStockItems;
            
            $stockStatus = [
                'inStock' => $total > 0 ? round(($inStock / $total) * 100) : 0,
                'lowStock' => $total > 0 ? round(($lowStock / $total) * 100) : 0,
                'outOfStock' => $total > 0 ? round(($outOfStockItems / $total) * 100) : 0,
            ];
            
            // Top categories by value
            $categoryData = $medicines->groupBy('product_category')
                ->map(function($categoryMedicines) {
                    return [
                        'count' => $categoryMedicines->count(),
                        'value' => $categoryMedicines->sum(function($medicine) {
                            return $medicine->current_quantity * floatval($medicine->product_price);
                        })
                    ];
                })
                ->sortByDesc('value')
                ->take(5)
                ->map(function($data, $category) {
                    return [
                        'name' => $category ?: 'Uncategorized',
                        'count' => $data['count'],
                        'value' => $data['value']
                    ];
                })
                ->values();
            
            // Recent stock adjustments
            $recentAdjustments = StockAdjustment::with('medicine')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function($adjustment) {
                    return [
                        'id' => $adjustment->id,
                        'type' => $adjustment->adjustment_type,
                        'description' => $adjustment->reason,
                        'timestamp' => $adjustment->created_at->toISOString(),
                        'status' => $adjustment->adjustment_type === 'increase' ? 'success' : 
                                  ($adjustment->adjustment_type === 'decrease' ? 'error' : 'warning')
                    ];
                });
            
            // Stock trends (last 7 days)
            $stockTrends = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i)->format('Y-m-d');
                $stockTrends[] = [
                    'date' => $date,
                    'inStock' => $medicines->filter(function($medicine) {
                        return $medicine->current_quantity > 20;
                    })->count(),
                    'lowStock' => $medicines->filter(function($medicine) {
                        return $medicine->current_quantity <= 20 && $medicine->current_quantity > 0;
                    })->count(),
                    'outOfStock' => $medicines->filter(function($medicine) {
                        return $medicine->current_quantity === 0;
                    })->count(),
                ];
            }
            
            // Generate alerts
            $alerts = [];
            
            // Low stock alerts
            $lowStockMedicines = $medicines->filter(function($medicine) {
                return $medicine->current_quantity <= 10 && $medicine->current_quantity > 0;
            })->take(3);
            
            foreach ($lowStockMedicines as $medicine) {
                $alerts[] = [
                    'id' => 'low-' . $medicine->id,
                    'type' => 'low_stock',
                    'title' => 'Low Stock Alert',
                    'message' => $medicine->product_name . ' has only ' . $medicine->current_quantity . ' units remaining',
                    'severity' => 'warning',
                    'timestamp' => Carbon::now()->toISOString(),
                    'isRead' => false
                ];
            }
            
            // Out of stock alerts
            $outOfStockMedicines = $medicines->filter(function($medicine) {
                return $medicine->current_quantity === 0;
            })->take(3);
            
            foreach ($outOfStockMedicines as $medicine) {
                $alerts[] = [
                    'id' => 'out-' . $medicine->id,
                    'type' => 'out_of_stock',
                    'title' => 'Out of Stock',
                    'message' => $medicine->product_name . ' is completely out of stock',
                    'severity' => 'error',
                    'timestamp' => Carbon::now()->toISOString(),
                    'isRead' => false
                ];
            }
            
            // Expiring alerts
            $expiringMedicines = $medicines->filter(function($medicine) {
                $expiryDate = Carbon::parse($medicine->expire_date);
                $threeMonthsFromNow = Carbon::now()->addMonths(3);
                return $expiryDate <= $threeMonthsFromNow && $medicine->current_quantity > 0;
            })->take(3);
            
            foreach ($expiringMedicines as $medicine) {
                $alerts[] = [
                    'id' => 'exp-' . $medicine->id,
                    'type' => 'expiring',
                    'title' => 'Expiring Soon',
                    'message' => $medicine->product_name . ' expires on ' . Carbon::parse($medicine->expire_date)->format('d/m/Y'),
                    'severity' => 'warning',
                    'timestamp' => Carbon::now()->toISOString(),
                    'isRead' => false
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'totalItems' => $totalItems,
                    'totalValue' => $totalValue,
                    'lowStockItems' => $lowStockItems,
                    'outOfStockItems' => $outOfStockItems,
                    'expiringItems' => $expiringItems,
                    'stockStatus' => $stockStatus,
                    'topCategories' => $categoryData,
                    'recentActivities' => $recentAdjustments,
                    'stockTrends' => $stockTrends,
                    'alerts' => $alerts
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch store dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 