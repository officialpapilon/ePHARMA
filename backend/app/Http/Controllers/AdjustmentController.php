<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Models\Adjustment;
use App\Models\Medicines;
use App\Models\MedicinesCache;

class AdjustmentController extends Controller
{
    public function index()
    {
        return Adjustment::all();
    }



    public function store(Request $request)
    {
        Log::info('Adjustment Store Request', $request->all());
    
        try {
            $validated = $request->validate([
                'product_id' => 'required|string',
                'batch_no' => 'required|string|max:255',
                'adjustment_date' => 'required|date',
                'adjustment_type' => 'required|string|max:255',
                'quantity_adjusted' => 'required|integer',
                'created_by' => 'required|string|max:255',
            ]);
            Log::info('Validation Passed', $validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Failed', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);  
        }
    
        $adjustment = Adjustment::create([
            'product_id' => $validated['product_id'],
            'batch_no' => $validated['batch_no'],
            'adjustment_date' => $validated['adjustment_date'],
            'adjustment_type' => $validated['adjustment_type'],
            'quantity_adjusted' => $validated['quantity_adjusted'],
            'created_by' => $validated['created_by'],
        ]);
        
        Log::info('Adjustment Created', ['adjustment' => $adjustment]);
    
        $medicine = Medicines::find($validated['product_id']);
        
        if ($medicine) {
            Log::info('Medicine Found', ['medicine' => $medicine]);
        } else {
            Log::error('Medicine Not Found', ['product_id' => $validated['product_id']]);
        }
    
        $cache = MedicinesCache::where('product_id', $validated['product_id'])
                               ->where('batch_no', $validated['batch_no'])  
                               ->first();
        Log::info('MedicinesCache Retrieved', ['cache' => $cache]);
    
        if ($cache) {
            $newQuantity = $validated['adjustment_type'] === 'increase'
                ? $cache->current_quantity + $validated['quantity_adjusted']
                : $cache->current_quantity - $validated['quantity_adjusted'];
    
            Log::info('Calculated New Quantity', ['newQuantity' => $newQuantity]);
    
            $cache->update([
                'current_quantity' => max(0, $newQuantity),
            ]);
    
            Log::info('Updated MedicinesCache', ['cache' => $cache]);
        } else {
            MedicinesCache::create([
                'product_id' => $medicine->id,
                'batch_no' => $validated['batch_no'],  
                'product_name' => $medicine->product_name,
                'product_price' => $medicine->product_price,
                'product_category' => $medicine->product_category,
                'expire_date' => now()->addYear(), 
                'current_quantity' => max(0, $validated['quantity_adjusted']),
            ]);
    
            Log::info('Created New MedicinesCache for Product and Batch', ['product_id' => $validated['product_id'], 'batch_no' => $validated['batch_no']]);
        }
    
        return response()->json($adjustment, 201);
    }
    
    

    public function show($id)
    {
        $adjustment = Adjustment::findOrFail($id);
        return response()->json($adjustment);
    }

    public function destroy($id)
    {
        $adjustment = Adjustment::findOrFail($id);
        $adjustment->delete();

        return response()->noContent();  
    }
}
