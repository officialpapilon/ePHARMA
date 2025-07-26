<?php

namespace App\Http\Controllers;

use App\Models\PaymentApproval;
use App\Models\Carts;
use App\Models\Patients;
use App\Models\MedicinesCache;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentApprovalController extends Controller
{
    public function index()
    {
        $paymentApprovals = PaymentApproval::all();
        
        $enhancedApprovals = $paymentApprovals->map(function ($approval) {
            return $this->enhanceApprovalData($approval);
        });
        
        return response()->json($enhancedApprovals);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'Patient_ID' => 'required|string',
            'transaction_ID' => 'required|string',
            'status' => 'required|string',
            'approved_by' => 'required|integer',
            'approved_amount' => 'required|string',
            'approved_payment_method' => 'required|string',
        ]);

        // Get the original cart to get all products
        $cart = Carts::where('transaction_ID', $validated['transaction_ID'])->first();
        
        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Cart not found for this transaction'
            ], 404);
        }

        // Calculate total quantity from all products
        $totalQuantity = 0;
        foreach ($cart->product_purchased as $product) {
            $totalQuantity += $product['product_quantity'];
        }

        // Generate a unique dispense ID
        $dispenseId = 'DISP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

        // Get user name for approved_by
        $user = User::find($validated['approved_by']);
        $approvedByName = $user ? ($user->first_name . ' ' . $user->last_name) : 'Unknown User';

        try {
            $paymentApproval = PaymentApproval::create([
                'Patient_ID' => $validated['Patient_ID'],
                'Product_ID' => $cart->product_purchased[0]['product_id'], // Keep first product for compatibility
                'transaction_ID' => $validated['transaction_ID'],
                'status' => 'Paid', // Change from 'Approved' to 'Paid'
                'approved_by' => $validated['approved_by'],
                'approved_quantity' => $totalQuantity,
                'approved_amount' => $validated['approved_amount'],
                'approved_payment_method' => $validated['approved_payment_method'],
                'dispense_id' => $dispenseId,
                'approved_at' => now(),
                'created_by' => $validated['approved_by'], // Use approved_by as created_by, but it's optional
            ]);

            // Verify dispense_id was saved
            if (!$paymentApproval->dispense_id) {
                throw new \Exception('Failed to generate dispense ID');
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment approved successfully',
                'data' => [
                    'Payment_ID' => $paymentApproval->Payment_ID,
                    'Patient_ID' => $paymentApproval->Patient_ID,
                    'Product_ID' => $paymentApproval->Product_ID,
                    'transaction_ID' => $paymentApproval->transaction_ID,
                    'status' => $paymentApproval->status,
                    'approved_by' => $paymentApproval->approved_by,
                    'approved_by_name' => $approvedByName,
                    'approved_quantity' => $paymentApproval->approved_quantity,
                    'approved_amount' => $paymentApproval->approved_amount,
                    'approved_payment_method' => $paymentApproval->approved_payment_method,
                    'approved_at' => $paymentApproval->approved_at,
                    'dispense_id' => $paymentApproval->dispense_id,
                    'created_by' => $paymentApproval->created_by,
                    'created_at' => $paymentApproval->created_at,
                    'updated_at' => $paymentApproval->updated_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment approval: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $paymentApproval = PaymentApproval::findOrFail($id);
        return response()->json($this->enhanceApprovalData($paymentApproval));
    }

    public function update(Request $request, $id)
    {
        $paymentApproval = PaymentApproval::findOrFail($id);

        $request->validate([
            'status' => 'required|string|in:Approved,Pending',
        ]);

        $cart = Carts::where('transaction_ID', $request->transaction_ID)
                    ->where('patient_ID', $request->Patient_ID)
                    ->first();

        if (!$cart) {
            throw ValidationException::withMessages([
                'transaction_ID' => ['Not Paid.']
            ]);
        }

        $paymentApproval->update([
            'Patient_ID' => $request->Patient_ID,
            'Product_ID' => $request->Product_ID,
            'transaction_ID' => $request->transaction_ID,
            'status' => $request->status,
            // 'approved_by' => $request->approved_by,
            'approved_at' => $request->approved_at ?? now(),
            'approved_quantity' => $request->approved_quantity,
            'approved_amount' => $request->approved_amount,
            // 'approved_payment_method' => $request->approved_payment_method,
        ]);

        return response()->json($this->enhanceApprovalData($paymentApproval));
    }

    public function destroy($id)
    {
        $paymentApproval = PaymentApproval::findOrFail($id);
        $paymentApproval->delete();
        return response()->json(['message' => 'Payment Approval deleted successfully']);
    }

    private function enhanceApprovalData(PaymentApproval $approval)
    {
        $patient = Patients::find($approval->Patient_ID);
        $patientName = $patient ? $patient->first_name . ' ' . $patient->last_name : 'Unknown Patient';
        
        $product = MedicinesCache::where('product_id', $approval->Product_ID)->first();
        $productName = $product ? $product->product_name : 'Unknown Product';
        $currentQuantity = $product ? $product->current_quantity : 0;
        
        $employee = User::find($approval->approved_by);
        $employeeName = $employee ? $employee->first_name . ' ' . $employee->last_name : 'Unknown Employee';
        
        return [
            'id' => $approval->id,
            'Payment_ID' => $approval->Payment_ID,
            'Patient_ID' => $approval->Patient_ID,
            'patient_name' => $patientName,
            'Product_ID' => $approval->Product_ID,
            'product_name' => $productName,
            'current_quantity' => $currentQuantity,
            'transaction_ID' => $approval->transaction_ID,
            'status' => $approval->status,
            'approved_by' => $approval->approved_by,
            'approved_by_name' => $employeeName,
            'approved_at' => $approval->approved_at,
            'approved_quantity' => $approval->approved_quantity,
            'approved_amount' => $approval->approved_amount,
            'approved_payment_method' => $approval->approved_payment_method,
            'dispense_id' => $approval->dispense_id,
            'created_at' => $approval->created_at,
            'updated_at' => $approval->updated_at,
        ];
    }
}