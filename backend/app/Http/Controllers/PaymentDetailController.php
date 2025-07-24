<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentDetails;
use App\Models\Dispensed;

class PaymentDetailController extends Controller
{
   
    public function index()
    {
        return response()->json(PaymentDetails::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => 'required|exists:dispensed,id',  
            'payment_status' => 'required|string',
            'payment_method' => 'required|string',
            'payed_amount' => 'required|numeric|min:0',
            'created_by' => 'required|string',
            'updated_by' => 'nullable|string',
            
        ]);

        $paymentDetail = PaymentDetails::create($validated);

        return response()->json($paymentDetail, 201);  
    }

   
    public function show($id)
    {
        $paymentDetail = PaymentDetails::findOrFail($id);

        return response()->json($paymentDetail);
    }

   
    public function update(Request $request, $id)
    {
        $paymentDetail = PaymentDetails::findOrFail($id);

        $validated = $request->validate([
            'payment_status' => 'required|string',
            'payment_method' => 'required|string',
            'payed_amount' => 'required|numeric|min:0',
            'updated_by' => 'nullable|string',
           
        ]);

        $paymentDetail->update($validated);

        return response()->json($paymentDetail);
    }

   
    public function destroy($id)
    {
        $paymentDetail = PaymentDetails::findOrFail($id);

        $paymentDetail->delete();

        return response()->noContent();  
    }
}
