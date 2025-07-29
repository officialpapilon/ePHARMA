<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\StockTaking;
use App\Models\Medicines;
use App\Models\MedicinesCache;

class StockTakingController extends Controller
{
    public function index()
    {
        return StockTaking::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'products' => 'required|array',
            'products.*.product_id' => 'required',
            'products.*.batches' => 'required|array',  
            'products.*.batches.*.batch_no' => 'required|string|max:255',
            'products.*.batches.*.product_quantity' => 'required|integer',
            'products.*.batches.*.manufacture_date' => 'required|date',
            'products.*.batches.*.expire_date' => 'required|date',
            'products.*.batches.*.buying_price' => 'required|numeric|min:0',
            'created_by' => 'required|string|max:255',
        ]);

        Log::info('StockTaking store request received', $validated);

        try {
            $stockTaking = StockTaking::create([
                'products' => $validated['products'],
                'created_by' => $validated['created_by'],
            ]);

            Log::info('StockTaking record created', ['stockTaking' => $stockTaking]);

            foreach ($validated['products'] as $product) {
                Log::info('Processing product', ['product_id' => $product['product_id']]);

                $medicine = Medicines::find($product['product_id']);  

                if (!$medicine) {
                    Log::error('Medicine not found', ['product_id' => $product['product_id']]);
                    return response()->json(['message' => 'Medicine not found with ID ' . $product['product_id']], 404);
                }

                Log::info('Found medicine details', ['medicine' => $medicine]);

                foreach ($product['batches'] as $batch) {
                    Log::info('Processing batch', ['batch_no' => $batch['batch_no']]);

                    MedicinesCache::updateOrCreate(
                        ['product_id' => $product['product_id'], 'batch_no' => $batch['batch_no']], 
                        [
                            'batch_no' => $batch['batch_no'],
                            'product_name' => $medicine->product_name,
                            'product_price' => $medicine->product_price,
                            'buying_price' => $batch['buying_price'],
                            'product_category' => $medicine->product_category,
                            'expire_date' => $batch['expire_date'],
                            'current_quantity' => DB::raw('IFNULL(current_quantity, 0) + ' . (int) $batch['product_quantity']),
                        ]
                    );                    
                }
            }

            Log::info('Stock-taking process completed successfully', ['stockTaking' => $stockTaking]);

            return response()->json($stockTaking, 201);
        } catch (\Exception $e) {
            Log::error('Error occurred while processing stock-taking', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'An error occurred while processing the stock-taking.'], 500);
        }
    }

    public function show($id)
    {
        $stockTaking = StockTaking::findOrFail($id);
        return response()->json($stockTaking);
    }

    public function destroy($id)
    {
        $stockTaking = StockTaking::findOrFail($id);
        $stockTaking->delete();

        return response()->noContent();
    }
}
