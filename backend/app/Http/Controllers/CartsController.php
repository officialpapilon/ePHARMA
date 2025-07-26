<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Carts;
use App\Models\PaymentApproval;
use App\Models\Patients;
use App\Models\MedicinesCache;

class CartsController extends Controller
{

    public function index(Request $request)
    {
        $status = $request->query('status');
        
        if ($status === 'sent_to_cashier') {
            // Get all carts
            $carts = Carts::all();
            
            // Get all paid transaction IDs from payment_approval table
            $paidTransactionIds = PaymentApproval::pluck('transaction_ID')->toArray();
            
            // Filter out carts that have been paid
            $pendingCarts = $carts->filter(function ($cart) use ($paidTransactionIds) {
                return !in_array($cart->transaction_ID, $paidTransactionIds);
            });
            
            // Enhance carts with complete patient and product details
            $enhancedCarts = $pendingCarts->map(function ($cart) {
                $patient = Patients::find($cart->patient_ID);
                
                // Enhance product details
                $enhancedProducts = [];
                foreach ($cart->product_purchased as $product) {
                    $medicine = MedicinesCache::where('product_id', $product['product_id'])->first();
                    $enhancedProducts[] = [
                        'product_id' => $product['product_id'],
                        'product_name' => $medicine ? $medicine->product_name : 'Unknown Product',
                        'product_quantity' => $product['product_quantity'],
                        'product_price' => $product['product_price'],
                        'current_stock' => $medicine ? $medicine->current_quantity : 0,
                        'product_category' => $medicine ? $medicine->product_category : 'Unknown',
                    ];
                }
                
                return [
                    'transaction_ID' => $cart->transaction_ID,
                    'patient_ID' => $cart->patient_ID,
                    'patient_name' => $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'Unknown Patient',
                    'patient_phone' => $patient ? $patient->phone : 'N/A',
                    'patient_email' => $patient ? $patient->email : 'N/A',
                    'patient_address' => $patient ? $patient->address : 'N/A',
                    'patient_age' => $patient ? $patient->age : null,
                    'patient_gender' => $patient ? $patient->gender : 'N/A',
                    'product_purchased' => $enhancedProducts,
                    'total_price' => $cart->total_price,
                    'status' => $cart->status,
                    'created_at' => $cart->created_at,
                    'updated_at' => $cart->updated_at,
                ];
            });
            
            return $enhancedCarts->values();
        }
        
        return Carts::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_ID' => 'required|string',
            'product_purchased' => 'required|array',
            'total_price' => 'required|numeric',
            'status' => 'required|string',
        ]);

        $cart = Carts::create([
            'patient_ID' => $validated['patient_ID'],
            'product_purchased' => $validated['product_purchased'],
            'total_price' => $validated['total_price'],
            'status' => $validated['status'] ?? 'sent_to_cashier',
        ]);

        // Get patient details
        $patient = Patients::find($cart->patient_ID);
        $patientName = $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'Unknown Patient';
        $patientPhone = $patient ? $patient->phone : 'N/A';

        return response()->json([
            'message' => 'Cart created successfully',
            'data' => [
                'transaction_ID' => $cart->transaction_ID,
                'patient_ID' => $cart->patient_ID,
                'patient_name' => $patientName,
                'patient_phone' => $patientPhone,
                'product_purchased' => $cart->product_purchased,
                'total_price' => $cart->total_price,
                'status' => $cart->status,
                'created_at' => $cart->created_at,
                'updated_at' => $cart->updated_at,
            ]
        ], 201);
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