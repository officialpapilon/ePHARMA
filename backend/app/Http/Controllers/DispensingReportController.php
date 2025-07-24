<?php

namespace App\Http\Controllers;

use App\Models\Dispensed;
use App\Models\PaymentDetails;
use App\Models\Patients;
use App\Models\PharmacySetting;
use App\Models\Medicines;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DispensingReportController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'medicine_name' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);
    
        $paymentOptions = PharmacySetting::getSettings()->payment_options ?? [];
        $paymentOptionsMap = collect($paymentOptions)->keyBy('id');
    
        $query = Dispensed::query()
            ->select([
                'dispensed.transaction_id',
                'dispensed.transaction_status',
                'dispensed.created_at',
                'dispensed.product_purchased',
                'dispensed.product_quantity',
                'dispensed.total_price',
                'dispensed.customer_id',
                'patients.first_name',
                'patients.last_name',
                'patients.phone',
            ])
            ->leftJoin('patients', 'dispensed.customer_id', '=', 'patients.id');
    
        if ($request->has('start_date')) {
            $query->whereDate('dispensed.created_at', '>=', $request->start_date);
        }
    
        if ($request->has('end_date')) {
            $query->whereDate('dispensed.created_at', '<=', $request->end_date);
        }
    
        if ($request->has('payment_method') && $request->payment_method) {
            $query->whereHas('paymentDetails', function($q) use ($request) {
                $q->where('payment_method', $request->payment_method);
            });
        }
    
        $perPage = $request->per_page ?? 10;
        $currentPage = $request->page ?? 1;
        
        $transactions = $query->orderBy('dispensed.created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $currentPage);
    
        $paymentDetails = PaymentDetails::whereIn('transaction_id', $transactions->pluck('transaction_id'))
            ->get()
            ->keyBy('transaction_id');
    
        $medicineIds = [];
        $medicineNameFilter = $request->medicine_name ?? null;
        
        foreach ($transactions as $transaction) {
            $productPurchased = is_array($transaction->product_purchased) 
                ? $transaction->product_purchased 
                : json_decode($transaction->product_purchased, true);
            
            if (is_array($productPurchased)) {
                $medicineIds = array_merge($medicineIds, $productPurchased);
            }
        }
    
        $medicineQuery = Medicines::whereIn('product_id', array_unique($medicineIds));
        
        if ($medicineNameFilter) {
            $medicineQuery->where('product_name', 'like', '%'.$medicineNameFilter.'%');
        }
    
        $medicines = $medicineQuery->pluck('product_name', 'product_id')->toArray();
    
        $filteredItems = $transactions->getCollection()->map(function ($transaction) use ($paymentOptionsMap, $medicines, $paymentDetails, $medicineNameFilter) {
            $items = [];
            $productPurchased = is_array($transaction->product_purchased) 
                ? $transaction->product_purchased 
                : json_decode($transaction->product_purchased, true);
            
            $productQuantity = is_array($transaction->product_quantity) 
                ? $transaction->product_quantity 
                : json_decode($transaction->product_quantity, true);
    
            if (is_array($productPurchased) && is_array($productQuantity)) {
                foreach ($productPurchased as $index => $productId) {
                    if ($medicineNameFilter && 
                        (!isset($medicines[$productId]) || 
                        stripos($medicines[$productId], $medicineNameFilter) === false)) {
                        continue;
                    }
                    
                    $items[] = [
                        'id' => $productId,
                        'name' => $medicines[$productId] ?? 'Unknown Product',
                        'quantity' => $productQuantity[$index] ?? 1,
                    ];
                }
            }
    
            if ($medicineNameFilter && empty($items)) {
                return null;
            }
    
            $payment = $paymentDetails[$transaction->transaction_id] ?? null;
    
            return [
                'transaction_ID' => $transaction->transaction_id,
                'Patient_ID' => $transaction->customer_id ?? null,
                'patient_name' => $transaction->first_name 
                    ? $transaction->first_name . ' ' . $transaction->last_name
                    : 'Anonymous',
                'patient_phone' => $transaction->phone ?? 'N/A',
                'approved_at' => $transaction->created_at,
                'approved_amount' => $payment ? $payment->payed_amount : $transaction->total_price,
                'approved_payment_method' => $payment 
                    ? ($paymentOptionsMap[$payment->payment_method]['name'] ?? 'Unknown')
                    : 'Unknown',
                'approved_payment_method_id' => $payment ? $payment->payment_method : null,
                'status' => $payment ? $payment->payment_status : $transaction->transaction_status,
                'items' => $items,
            ];
        })->filter(); 
        
        $transactions->setCollection($filteredItems);
    
        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'message' => 'Dispensing report data retrieved successfully'
        ]);
    }

    public function paymentMethods()
    {
        $paymentOptions = PharmacySetting::getSettings()->payment_options ?? [];
        
        return response()->json([
            'success' => true,
            'data' => $paymentOptions,
            'message' => 'Payment methods retrieved successfully'
        ]);
    }
}