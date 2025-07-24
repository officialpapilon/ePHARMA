<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Carts;

class CartsController extends Controller
{

    public function index(Request $request)
    {
        return Carts::all();
    }

    public function store(Request $request)
    {
        $isSimple = $request->has('isSimple') && $request->input('isSimple') === 'true';

        $validationRules = [
            'product_purchased' => 'required|array',  
            'product_purchased.*.product_id' => 'required|integer',  
            'product_purchased.*.product_quantity' => 'required|integer',  
            'product_purchased.*.product_price' => 'required|numeric',  
            'total_price' => 'required|numeric',
        ];

        if (!$isSimple) {
            $validationRules['patient_ID'] = 'required|string';
        } else {
            $validationRules['patient_ID'] = 'sometimes|string';
        }

        $validated = $request->validate($validationRules);

        if ($isSimple && !isset($validated['patient_ID'])) {
            $validated['patient_ID'] = 'A-' . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        }

        $cart = Carts::create($validated);

        $response = [
            'message' => 'Cart created successfully',
            'data' => $cart
        ];

        if ($isSimple && !$request->has('patient_ID')) {
            $response['generated_patient_ID'] = $validated['patient_ID'];
        }

        return response()->json($response, 201);  
    }

    public function show($id)
    {
        $cart = Carts::findOrFail($id);

        return response()->json($cart);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'patient_ID' => 'string',
            'product_purchased' => 'array',  
            'product_purchased.*.product_id' => 'required|integer',  
            'product_purchased.*.product_quantity' => 'required|integer',  
            'product_purchased.*.product_price' => 'required|numeric',  
            'total_price' => 'numeric',
        ]);

        $cart = Carts::findOrFail($id);

        $cart->update($validated);

        return response()->json($cart);
    }

    public function destroy($id)
    {
        Carts::destroy($id);

        return response()->noContent();
    }
}