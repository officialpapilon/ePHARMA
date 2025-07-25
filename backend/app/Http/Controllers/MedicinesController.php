<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Medicines;

class MedicinesController extends Controller
{
   
    public function index()
    {
        $medicines = Medicines::orderBy('product_name', 'asc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $medicines,
            'message' => 'Medicines retrieved successfully'
        ]);
    }

    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_name' => 'required|string|max:255',
                'product_category' => 'required|string|max:255',
                'product_unit' => 'required|string|max:255',
                'product_price' => 'required|numeric|min:0',
                'unit_price' => 'nullable|numeric|min:0',
                'created_by' => 'nullable|integer',
                'updated_by' => 'nullable|integer',
            ]);

            $item = Medicines::create($validated);

            return response()->json([
                'success' => true,
                'data' => $item,
                'message' => 'Medicine created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create medicine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

   
    public function show($id)
    {
        try {
            $item = Medicines::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $item,
                'message' => 'Medicine retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Medicine not found'
            ], 404);
        }
    }

    
    public function update(Request $request, $id)
    {
        try {
            $item = Medicines::findOrFail($id);
            
            $validated = $request->validate([
                'product_name' => 'sometimes|required|string|max:255',
                'product_category' => 'sometimes|required|string|max:255',
                'product_unit' => 'sometimes|required|string|max:255',
                'product_price' => 'sometimes|required|numeric|min:0',
                'unit_price' => 'nullable|numeric|min:0',
                'updated_by' => 'nullable|integer',
            ]);

            $item->update($validated);

            return response()->json([
                'success' => true,
                'data' => $item,
                'message' => 'Medicine updated successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medicine'
            ], 500);
        }
    }


   
    public function destroy($id)
    {
        try {
            $item = Medicines::findOrFail($id);
            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Medicine deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete medicine'
            ], 500);
        }
    }
}

        return response()->noContent();
    }
}
