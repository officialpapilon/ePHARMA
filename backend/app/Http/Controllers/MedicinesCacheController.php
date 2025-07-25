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
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        
        $query = MedicinesCache::query()
            ->select([
                'id',
                'product_id',
                'batch_no',
                'product_name',
                'product_price',
                'product_category',
                'expire_date',
                'current_quantity',
                'created_at',
                'updated_at'
            ]);
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                  ->orWhere('product_category', 'like', "%{$search}%")
                  ->orWhere('batch_no', 'like', "%{$search}%");
            });
        }
        
        $query->orderBy('product_name', 'asc');
        
        $medicines = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $medicines->items(),
            'meta' => [
                'current_page' => $medicines->currentPage(),
                'last_page' => $medicines->lastPage(),
                'per_page' => $medicines->perPage(),
                'total' => $medicines->total(),
                'from' => $medicines->firstItem(),
                'to' => $medicines->lastItem(),
            ],
            'message' => 'Medicines retrieved successfully'
        ]);
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