<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Medicines;

class MedicinesController extends Controller
{
   
    public function index()
    {
        return Medicines::all();
    }

    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'product_category' => 'required|string|max:255',
            'product_unit' => 'required|string|max:255',
            'product_price' => 'required|numeric',
            'created_by' => 'nullable|integer|max:255',
            'updated_by' => 'nullable|string|max:255',
        ]);

        $item = Medicines::create($validated);

        return response()->json($item, 201);  
    }

   
    public function show($id)
    {
        $item = Medicines::findOrFail($id);

        return response()->json($item);
    }

    
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'product_category' => 'required|string|max:255',
            'product_unit' => 'required|string|max:255',
            'product_price' => 'required|numeric',
            'created_by' => 'nullable|integer|max:255',
            'updated_by' => 'nullable|string|max:255',
        ]);

        $item = Medicines::findOrFail($id);

        $item->update($validated);

        return response()->json($item);
    }

   
    public function destroy($id)
    {
        $item = Medicines::findOrFail($id);

        $item->delete();

        return response()->noContent();
    }
}
