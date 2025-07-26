<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patients;
use App\Models\MedicinesCache;
use App\Models\Carts;
use App\Models\Dispensed;
use App\Models\PaymentApproval;
use App\Models\FinancialActivity;
use Carbon\Carbon;

class CashierDashboardController extends Controller
{
    public function index(Request $request)
    {
        $tokenUser = $request->user();

        // Total Customers
        $totalCustomers = Patients::count();

        // Total Products
        $totalProducts = MedicinesCache::count();

        // Low Stock & Expiring Soon
        $lowStockCount = MedicinesCache::where('current_quantity', '<', 10)->count();
        $expiringSoonCount = MedicinesCache::whereDate('expire_date', '>=', now())
            ->whereDate('expire_date', '<=', now()->addDays(30))
            ->count();

        // Total Sales (from payment_approval where status is approved)
        $totalSales = PaymentApproval::where('status', 'Approved')->sum('approved_amount');

        // Pending Payments (from payment_approval where status is pending)
        $pendingPayments = PaymentApproval::where('status', 'pending')->sum('approved_amount');

        // Recent Transactions (latest 5 from payment_approval with customer and product details)
        $recentTransactions = PaymentApproval::with(['patient:id,first_name,last_name'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($transaction, $index) {
                // Parse product details from the transaction
                $products = [];
                if ($transaction->Product_ID) {
                    // Try to get product name from medicines_caches table
                    $medicine = MedicinesCache::find($transaction->Product_ID);
                    if ($medicine) {
                        $products[] = $medicine->product_name;
                    } else {
                        $products[] = 'Product ID: ' . $transaction->Product_ID;
                    }
                }
                
                return [
                    'id' => $transaction->Payment_ID,
                    'sn' => $index + 1,
                    'patient_ID' => $transaction->Patient_ID,
                    'customer_name' => $transaction->patient ? 
                        ($transaction->patient->first_name . ' ' . $transaction->patient->last_name) : 
                        'Unknown Customer',
                    'total_price' => $transaction->approved_amount,
                    'products_sold' => implode(', ', $products),
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at,
                ];
            });

        // Sales Data for Chart (last 7 days from payment_approval)
        $salesData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $sales = PaymentApproval::whereDate('created_at', $date)
                ->where('status', 'Approved')
                ->sum('approved_amount');
            $salesData[] = [
                'date' => $date,
                'sales' => (float)$sales,
            ];
        }

        // Financial Control Data (real data from financial activities)
        $cashIn = PaymentApproval::where('status', 'Approved')->sum('approved_amount');
        $cashOut = FinancialActivity::expense()->approved()->sum('amount');
        $refunds = FinancialActivity::where('type', 'refund')->approved()->sum('amount');
        $expenses = FinancialActivity::expense()->approved()->sum('amount');
        $netBalance = $cashIn - $expenses + $refunds;

        return response()->json([
            'success' => true,
            'data' => [
                'totalCustomers' => $totalCustomers,
                'totalProducts' => $totalProducts,
                'totalSales' => (float)$totalSales,
                'pendingPayments' => (float)$pendingPayments,
                'lowStockCount' => $lowStockCount,
                'expiringSoonCount' => $expiringSoonCount,
                'recentTransactions' => $recentTransactions,
                'salesData' => $salesData,
                'financialControl' => [
                    'cashIn' => (float)$cashIn,
                    'cashOut' => (float)$cashOut,
                    'netBalance' => (float)$netBalance,
                    'refunds' => (float)$refunds,
                    'expenses' => (float)$expenses,
                ],
            ],
        ]);
    }
} 