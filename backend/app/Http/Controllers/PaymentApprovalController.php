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
        $request->validate([
            'Patient_ID' => 'required',
            'Product_ID' => 'required',
            'transaction_ID' => 'required',
            'status' => 'required|string|in:Approved,Pending', 
            'approved_by' => 'required|integer',
            'approved_quantity' => 'required',
            'approved_amount' => 'required',
            'approved_payment_method' => 'required',
        ]);

        $cart = Carts::where('transaction_ID', $request->transaction_ID)
                    ->where('patient_ID', $request->Patient_ID)
                    ->first();

        if (!$cart) {
            throw ValidationException::withMessages([
                'transaction_ID' => ['Not Paid.']
            ]);
        }

        $paymentApproval = PaymentApproval::create([
            'Patient_ID' => $request->Patient_ID,
            'Product_ID' => $request->Product_ID,
            'transaction_ID' => $request->transaction_ID,
            'status' => $request->status,
            'approved_by' => $request->approved_by,
            'approved_at' => now(),
            'approved_quantity' => $request->approved_quantity,
            'approved_amount' => $request->approved_amount,
            'approved_payment_method' => $request->approved_payment_method,
        ]);

        return response()->json($this->enhanceApprovalData($paymentApproval), 201);
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
            'created_at' => $approval->created_at,
            'updated_at' => $approval->updated_at,
        ];
    }
}