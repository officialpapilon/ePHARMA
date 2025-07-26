<?php

namespace App\Http\Controllers;

use App\Models\PaymentApproval;
use App\Models\Patients;
use App\Models\MedicinesCache;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerTransactionController extends Controller
{
    /**
     * Get all customer transactions with detailed information
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PaymentApproval::query();

            // Filter by customer ID if provided
            if ($request->has('customer_id')) {
                $query->where('Patient_ID', $request->customer_id);
            }

            // Filter by date range if provided
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }

            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Enhance the data with customer and product information
            $enhancedTransactions = $transactions->getCollection()->map(function ($transaction) {
                return $this->enhanceTransactionData($transaction);
            });

            return response()->json([
                'success' => true,
                'data' => $enhancedTransactions,
                'meta' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
                'message' => 'Customer transactions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transactions for a specific customer
     */
    public function getCustomerTransactions($customerId, Request $request): JsonResponse
    {
        try {
            // Verify customer exists
            $customer = Patients::find($customerId);
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            $query = PaymentApproval::where('Patient_ID', $customerId);

            // Filter by date range if provided
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }

            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Enhance the data
            $enhancedTransactions = $transactions->getCollection()->map(function ($transaction) {
                return $this->enhanceTransactionData($transaction);
            });

            return response()->json([
                'success' => true,
                'data' => $enhancedTransactions,
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'age' => $customer->age,
                    'gender' => $customer->gender,
                ],
                'meta' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
                'message' => 'Customer transactions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transaction summary for a customer
     */
    public function getCustomerTransactionSummary($customerId): JsonResponse
    {
        try {
            // Verify customer exists
            $customer = Patients::find($customerId);
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            $transactions = PaymentApproval::where('Patient_ID', $customerId)->get();

            $summary = [
                'total_transactions' => $transactions->count(),
                'total_amount' => $transactions->sum('approved_amount'),
                'approved_transactions' => $transactions->where('status', 'Approved')->count(),
                'pending_transactions' => $transactions->where('status', 'Pending')->count(),
                'last_transaction_date' => $transactions->max('created_at'),
                'first_transaction_date' => $transactions->min('created_at'),
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ],
                'message' => 'Customer transaction summary retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer transaction summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all customers with their transaction summary (for patient records table)
     */
    public function customersWithTransactionSummary()
    {
        $customers = \App\Models\Patients::all();
        $result = $customers->map(function ($customer) {
            $transactions = \App\Models\PaymentApproval::where('Patient_ID', $customer->id)->get();
            $totalAmount = $transactions->sum('approved_amount');
            $transactionCount = $transactions->count();
            $lastTransactionDate = $transactions->max('created_at');
            return [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'gender' => $customer->gender,
                'age' => $customer->age,
                'transaction_count' => $transactionCount,
                'last_transaction_date' => $lastTransactionDate,
                'total_amount' => $totalAmount,
            ];
        });
        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Customers with transaction summary retrieved successfully'
        ]);
    }

    /**
     * Enhance transaction data with customer and product information
     */
    private function enhanceTransactionData(PaymentApproval $transaction): array
    {
        // Get customer information
        $customer = Patients::find($transaction->Patient_ID);
        $customerName = $customer ? $customer->first_name . ' ' . $customer->last_name : 'Unknown Customer';
        $customerPhone = $customer ? $customer->phone : 'N/A';
        
        // Get product information
        $product = MedicinesCache::where('product_id', $transaction->Product_ID)->first();
        $productName = $product ? $product->product_name : 'Unknown Product';
        $productPrice = $product ? $product->product_price : 0;
        $productCategory = $product ? $product->product_category : 'N/A';
        
        // Get employee information
        $employee = User::find($transaction->approved_by);
        $employeeName = $employee ? $employee->first_name . ' ' . $employee->last_name : 'Unknown Employee';
        
        return [
            'transaction_ID' => $transaction->transaction_ID,
            'Patient_ID' => $transaction->Patient_ID,
            'patient_name' => $customerName,
            'patient_phone' => $customerPhone,
            'Product_ID' => $transaction->Product_ID,
            'product_name' => $productName,
            'product_price' => $productPrice,
            'product_category' => $productCategory,
            'approved_quantity' => $transaction->approved_quantity,
            'approved_amount' => $transaction->approved_amount,
            'approved_payment_method' => $transaction->approved_payment_method,
            'approved_payment_method_id' => $transaction->approved_payment_method,
            'status' => $transaction->status,
            'approved_by' => $transaction->approved_by,
            'approved_by_name' => $employeeName,
            'approved_at' => $transaction->approved_at,
            'created_at' => $transaction->created_at,
            'updated_at' => $transaction->updated_at,
            // Additional calculated fields
            'unit_price' => $transaction->approved_quantity > 0 ? 
                round($transaction->approved_amount / $transaction->approved_quantity, 2) : 0,
            'formatted_date' => $transaction->created_at ? 
                $transaction->created_at->format('d/m/Y H:i') : 'N/A',
            'formatted_amount' => 'Tsh ' . number_format($transaction->approved_amount, 2),
        ];
    }
} 