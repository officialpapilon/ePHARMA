<?php

namespace App\Http\Controllers;

use App\Models\Dispensed;
use App\Models\PaymentApproval;
use App\Models\MedicinesCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Carts; // Added this import for the new dispenseByDispenseId method

class DispensedController extends Controller
{
   
    public function index(Request $request)
    {
        $perPage = $request->input('limit', 15);
        $page = $request->input('page', 1);
        
        $query = Dispensed::query();
        
        if ($request->has('status')) {
            $query->where('transaction_status', $request->input('status'));
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->input('start_date') . ' 00:00:00';
            $endDate = $request->input('end_date') . ' 23:59:59';
            
            $query->whereBetween('created_at', [
                $startDate,
                $endDate
            ]);
        }
        
        $query->orderBy('created_at', 'desc');
        
        $dispensed = $query->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'success' => true,
            'data' => $dispensed->items(),
            'current_page' => $dispensed->currentPage(),
            'per_page' => $dispensed->perPage(),
            'total' => $dispensed->total(),
            'last_page' => $dispensed->lastPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|string|unique:dispensed',
            'transaction_status' => 'required|string',
            'customer_id' => 'required|string',
            'product_purchased' => 'required|array',
            'product_quantity' => 'required|array',
            'total_price' => 'required|numeric',
            'created_by' => 'required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $dispensed = Dispensed::create($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $dispensed,
                'message' => 'Dispensed record created successfully'
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create dispensed record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

   
    public function show(string $id)
    {
        $dispensed = Dispensed::find($id);
        
        if (!$dispensed) {
            return response()->json([
                'success' => false,
                'message' => 'Dispensed record not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $dispensed
        ]);
    }

  
    public function update(Request $request, string $id)
    {
        $dispensed = Dispensed::find($id);
        
        if (!$dispensed) {
            return response()->json([
                'success' => false,
                'message' => 'Dispensed record not found'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'sometimes|required|string|unique:dispensed,transaction_id,'.$id,
            'transaction_status' => 'sometimes|required|string',
            'customer_id' => 'sometimes|required|string',
            'product_purchased' => 'sometimes|required|array',
            'product_quantity' => 'sometimes|required|array',
            'total_price' => 'sometimes|required|numeric',
            'created_by' => 'sometimes|required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $dispensed->update($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $dispensed,
                'message' => 'Dispensed record updated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update dispensed record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        $dispensed = Dispensed::find($id);
        
        if (!$dispensed) {
            return response()->json([
                'success' => false,
                'message' => 'Dispensed record not found'
            ], 404);
        }
        
        try {
            $dispensed->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Dispensed record deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete dispensed record',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
 
    public function statistics(Request $request)
    {
        $startDate = $request->input('start_date', now()->subDays(7)->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->format('Y-m-d'));
        
        $stats = Dispensed::selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN transaction_status = "completed" THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN transaction_status = "pending" THEN 1 ELSE 0 END) as pending
        ')
        ->whereBetween('created_at', [$startDate, $endDate])
        ->first();
        
        return response()->json([
            'success' => true,
            'data' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total' => $stats->total,
                'completed' => $stats->completed,
                'pending' => $stats->pending,
            ]
        ]);
    }

    /**
     * Dispense medicine using dispense_id
     */
    public function dispenseByDispenseId(Request $request, $dispenseId)
    {
        try {
            DB::beginTransaction();
            
            // Find the payment approval by dispense_id
            $paymentApproval = PaymentApproval::where('dispense_id', $dispenseId)->first();
            
            if (!$paymentApproval) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment approval not found for this dispense ID'
                ], 404);
            }
            
            // Check if already dispensed - only check by transaction_id since Payment_ID doesn't exist in dispensed table
            $alreadyDispensed = Dispensed::where('transaction_id', $paymentApproval->transaction_ID)->first();
            
            if ($alreadyDispensed) {
                return response()->json([
                    'success' => false,
                    'message' => 'This payment has already been used to dispense medicine'
                ], 422);
            }
            
            // Get the original cart to get all products
            $cart = Carts::where('transaction_ID', $paymentApproval->transaction_ID)->first();
            
            if (!$cart) {
                return response()->json([
                    'success' => false,
                    'message' => 'Original cart not found'
                ], 404);
            }
            
            $dispensedProducts = [];
            $productIds = [];
            $productQuantities = [];
            
            // Process each product in the cart
            foreach ($cart->product_purchased as $product) {
                $productId = $product['product_id'];
                $quantity = $product['product_quantity'];
                
                // Find the medicine and check stock
                $medicine = MedicinesCache::where('product_id', $productId)->first();
                
                if (!$medicine) {
                    DB::rollback();
                    return response()->json([
                        'success' => false,
                        'message' => "Medicine not found for product ID: {$productId}"
                    ], 404);
                }
                
                if ($medicine->current_quantity < $quantity) {
                    DB::rollback();
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for {$medicine->product_name}. Available: {$medicine->current_quantity}, Required: {$quantity}"
                    ], 422);
                }
                
                // Reduce stock quantity
                $medicine->current_quantity -= $quantity;
                $medicine->save();
                
                $dispensedProducts[] = [
                    'product_id' => $productId,
                    'product_name' => $medicine->product_name,
                    'quantity' => $quantity,
                    'remaining_stock' => $medicine->current_quantity
                ];
                
                $productIds[] = $productId;
                $productQuantities[] = $quantity;
            }
            
            // Create dispensed record - remove Payment_ID since it doesn't exist in the table
            $dispensed = Dispensed::create([
                'transaction_id' => $paymentApproval->transaction_ID,
                'transaction_status' => 'completed',
                'customer_id' => $paymentApproval->Patient_ID,
                'product_purchased' => $productIds,
                'product_quantity' => $productQuantities,
                'total_price' => $paymentApproval->approved_amount,
                'created_by' => $request->input('created_by', $paymentApproval->approved_by),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Medicine dispensed successfully',
                'data' => [
                    'dispense_id' => $dispenseId,
                    'payment_id' => $paymentApproval->Payment_ID,
                    'transaction_id' => $paymentApproval->transaction_ID,
                    'dispensed_id' => $dispensed->id,
                    'products' => $dispensedProducts,
                    'total_quantity' => array_sum($productQuantities)
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to dispense medicine',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}