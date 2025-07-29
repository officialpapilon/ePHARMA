<?php

namespace App\Http\Controllers;

use App\Models\MedicinesCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WholesaleProductController extends Controller
{
    /**
     * Get products for wholesale POS
     */
    public function index(Request $request)
    {
        try {
            $query = MedicinesCache::where('current_quantity', '>', 0);

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('product_name', 'like', "%{$search}%")
                      ->orWhere('product_category', 'like', "%{$search}%")
                      ->orWhere('product_id', 'like', "%{$search}%");
                });
            }

            // Apply category filter
            if ($request->filled('category')) {
                $query->where('product_category', $request->category);
            }

            $products = $query->orderBy('product_name')->get();

            // Transform data for frontend
            $transformedProducts = $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'product_category' => $product->product_category,
                    'product_unit' => $product->product_unit,
                    'current_quantity' => $product->current_quantity,
                    'product_price' => $product->product_price,
                    'batch_no' => $product->batch_no || 'DEFAULT-BATCH',
                    'wholesale_price' => $product->product_price, // Use same price for wholesale
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedProducts
            ]);

        } catch (\Exception $e) {
            Log::error('Wholesale products error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wholesale products'
            ], 500);
        }
    }

    /**
     * Get product categories
     */
    public function categories()
    {
        try {
            $categories = MedicinesCache::select('product_category')
                ->distinct()
                ->whereNotNull('product_category')
                ->where('product_category', '!=', '')
                ->orderBy('product_category')
                ->pluck('product_category');

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);

        } catch (\Exception $e) {
            Log::error('Product categories error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch product categories'
            ], 500);
        }
    }
} 