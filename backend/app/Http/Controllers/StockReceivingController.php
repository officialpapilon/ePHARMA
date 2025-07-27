<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\MedicinesCache;
use App\Models\StockReceiving;
use App\Models\StockReceivingItem;

class StockReceivingController extends Controller
{
    public function index()
    {
        try {
            $stockReceivings = StockReceiving::with('items')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stockReceivings,
                'message' => 'Stock receiving data retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock receiving data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'supplier_name' => 'required|string|max:255',
                'invoice_number' => 'required|string|max:255',
                'delivery_date' => 'required|date',
                'total_amount' => 'required|numeric|min:0',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|string',
                'items.*.batch_no' => 'required|string',
                'items.*.quantity_received' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.buying_price' => 'required|numeric|min:0',
                'items.*.manufacture_date' => 'required|date',
                'items.*.expire_date' => 'required|date',
            ]);

            DB::beginTransaction();

            // Create stock receiving record
            $stockReceiving = StockReceiving::create([
                'supplier_name' => $request->supplier_name,
                'invoice_number' => $request->invoice_number,
                'delivery_date' => $request->delivery_date,
                'total_amount' => $request->total_amount,
                'status' => 'received',
                'created_by' => auth()->id() ?? 1,
            ]);

            // Create stock receiving items
            foreach ($request->items as $item) {
                StockReceivingItem::create([
                    'receiving_id' => $stockReceiving->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'] ?? 'Unknown Product',
                    'batch_no' => $item['batch_no'],
                    'quantity_received' => $item['quantity_received'],
                    'unit_price' => $item['unit_price'],
                    'buying_price' => $item['buying_price'],
                    'manufacture_date' => $item['manufacture_date'],
                    'expire_date' => $item['expire_date'],
                ]);

                // Update or create medicines cache entry
                $existingCache = MedicinesCache::where('product_id', $item['product_id'])
                    ->where('batch_no', $item['batch_no'])
                    ->first();

                if ($existingCache) {
                    $existingCache->update([
                        'current_quantity' => $existingCache->current_quantity + $item['quantity_received'],
                        'buying_price' => $item['buying_price'],
                        'expire_date' => $item['expire_date'],
                    ]);
                } else {
                    MedicinesCache::create([
                        'product_id' => $item['product_id'],
                        'batch_no' => $item['batch_no'],
                        'product_name' => $item['product_name'] ?? 'Unknown Product',
                        'product_price' => $item['unit_price'],
                        'current_quantity' => $item['quantity_received'],
                        'buying_price' => $item['buying_price'],
                        'expire_date' => $item['expire_date'],
                        'created_by' => auth()->id() ?? 1,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $stockReceiving->load('items'),
                'message' => 'Stock receiving created successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create stock receiving',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $stockReceiving = StockReceiving::with('items')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $stockReceiving,
                'message' => 'Stock receiving details retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock receiving details',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 