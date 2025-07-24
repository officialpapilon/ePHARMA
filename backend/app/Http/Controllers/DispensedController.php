<?php

namespace App\Http\Controllers;

use App\Models\Dispensed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
}