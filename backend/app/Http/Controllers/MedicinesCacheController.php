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
        $all = $request->input('all', false); // New parameter to get all records
        
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
        
        // If all=true, return all records without pagination
        if ($all) {
            $medicines = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $medicines,
                'message' => 'Medicines retrieved successfully'
            ]);
        }
        
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

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'product_price' => 'nullable|numeric|min:0',
            'buying_price' => 'nullable|numeric|min:0',
            'current_quantity' => 'nullable|integer|min:0',
            'expire_date' => 'nullable|date',
            'batch_no' => 'nullable|string',
        ]);

        try {
            $medicine = MedicinesCache::findOrFail($id);
            $medicine->update($validated);
            
            return response()->json([
                'success' => true,
                'data' => $medicine,
                'message' => 'Medicine updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medicine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|string',
            'product_name' => 'required|string',
            'product_price' => 'required|numeric|min:0',
            'buying_price' => 'nullable|numeric|min:0',
            'product_category' => 'required|string',
            'expire_date' => 'required|date',
            'current_quantity' => 'required|integer|min:0',
            'batch_no' => 'required|string',
        ]);

        try {
            $medicine = MedicinesCache::create($validated);
            
            return response()->json([
                'success' => true,
                'data' => $medicine,
                'message' => 'Medicine created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create medicine',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}