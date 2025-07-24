<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MedicinesCache;
use App\Models\MedicineDispenseValidation;
use App\Models\Dispensed;
use App\Models\PaymentDetails;
use Illuminate\Support\Facades\Log;

class MedicinesCacheController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicinesCache::query();
        
        if ($request->has('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }
        
        return $query->paginate($request->input('limit', 10));
    }

    public function show($product_id)
    {
        $cache = MedicinesCache::findOrFail($product_id);
        return response()->json($cache);
    }

    public function update(Request $request, $product_id)
    {
        Log::info('Update called', [
            'product_id' => $product_id,
            'request_data' => $request->all()
        ]);
    
 
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'Payment_ID' => 'required|string',
            'Patient_ID' => 'required|string',
            'transaction_id' => 'required|string',
            'transaction_status' => 'required|string',
            'payment_method' => 'required|string',
            'approved_payment_method' => 'required|string',
            'total_price' => 'required|numeric',
            'created_by' => 'required|string',
        ]);
    
        try {
            $existingDispense = MedicineDispenseValidation::where('product_id', $product_id)
                ->where('Payment_ID', $validated['Payment_ID'])
                ->first();
            
            if ($existingDispense) {
                Log::warning('Duplicate Payment_ID detected', [
                    'product_id' => $product_id,
                    'Payment_ID' => $validated['Payment_ID']
                ]);
                return response()->json([
                    'message' => 'This payment has already been used to dispense this medicine'
                ], 400);
            }
    
            $batches = MedicinesCache::where('product_id', $product_id)
                ->orderBy('expire_date', 'asc')
                ->get();
    
            $totalQuantity = $batches->sum('current_quantity');
    
            if ($totalQuantity < $validated['quantity']) {
                Log::warning('Insufficient quantity across all batches', [
                    'product_id' => $product_id,
                    'total_quantity' => $totalQuantity,
                    'requested_quantity' => $validated['quantity']
                ]);
                return response()->json(['message' => 'Insufficient Medicine quantity across all batches'], 400);
            }
    
            $remainingQuantity = $validated['quantity'];
            foreach ($batches as $batch) {
                if ($remainingQuantity <= 0) break;
                $deductedQuantity = min($batch->current_quantity, $remainingQuantity);
                $batch->current_quantity -= $deductedQuantity;
                $remainingQuantity -= $deductedQuantity;
                $batch->save();
            }
    
            MedicineDispenseValidation::create([
                'product_id' => $product_id,
                'Payment_ID' => $validated['Payment_ID'],
                'Patient_ID' => $validated['Patient_ID'],
                'quantity' => $validated['quantity']
            ]);
    
            Dispensed::create([
                'transaction_id' => $validated['transaction_id'],
                'transaction_status' => $validated['transaction_status'],
                'customer_id' => $validated['Patient_ID'], 
                'product_purchased' => [$product_id], 
                'product_quantity' => [$validated['quantity']], 
                'approved_payment_method' => $validated ['approved_payment_method'], 
                'total_price' => $validated['total_price'],
                'created_by' => $validated['created_by'],
            ]);

            PaymentDetails::create([
                'transaction_id' => $validated['transaction_id'],
                'payment_status' => $validated['transaction_status'],
                'payment_method' => $validated ['approved_payment_method'], 
                'approved_payment_method' => $validated ['approved_payment_method'], 
                'payed_amount' => $validated['total_price'],
                'created_by' => $validated['created_by'],
                'customer_id' => $validated['Patient_ID'],
            ]);
    
            return response()->json(['message' => 'Dispensed successfully'], 200);
            
        } catch (\Exception $e) {
            Log::error('Dispense Error', [
                'product_id' => $product_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
    
            return response()->json([
                'message' => env('APP_DEBUG') ? $e->getMessage() : 'An unexpected error occurred',
                'error_details' => env('APP_DEBUG') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTrace()
                ] : null
            ], 500);
        }
    }
}