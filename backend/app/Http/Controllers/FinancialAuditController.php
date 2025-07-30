<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PaymentApproval;
use App\Models\FinancialActivity;
use App\Models\WholesalePayment;
use App\Models\WholesaleOrder;
use App\Models\Dispensed;
use App\Models\PaymentDetails;
use App\Models\User;
use App\Models\Patients;
use App\Models\WholesaleCustomer;
use Carbon\Carbon;

class FinancialAuditController extends Controller
{
    public function index(Request $request)
    {
        try {
            $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', now()->format('Y-m-d'));
            $userId = $request->input('user_id');
            $transactionType = $request->input('transaction_type'); // 'pharmacy', 'wholesale', 'expense', 'all'

            // Get date range for filtering
            $startDateTime = $startDate . ' 00:00:00';
            $endDateTime = $endDate . ' 23:59:59';

            $auditData = [
                'summary' => $this->getFinancialSummary($startDateTime, $endDateTime),
                'pharmacy_transactions' => $this->getPharmacyTransactions($startDateTime, $endDateTime, $userId),
                'wholesale_transactions' => $this->getWholesaleTransactions($startDateTime, $endDateTime, $userId),
                'expenses' => $this->getExpenses($startDateTime, $endDateTime, $userId),
                'user_activity' => $this->getUserActivity($startDateTime, $endDateTime),
                'payment_methods_breakdown' => $this->getPaymentMethodsBreakdown($startDateTime, $endDateTime),
                'daily_trends' => $this->getDailyTrends($startDateTime, $endDateTime),
                'top_performers' => $this->getTopPerformers($startDateTime, $endDateTime),
                'audit_trail' => $this->getAuditTrail($startDateTime, $endDateTime, $userId),
            ];

            return response()->json([
                'success' => true,
                'data' => $auditData,
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'user_id' => $userId,
                    'transaction_type' => $transactionType,
                ],
                'message' => 'Financial audit data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve financial audit data: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getFinancialSummary($startDateTime, $endDateTime)
    {
        // Pharmacy Revenue (Complex Dispensing)
        $pharmacyRevenue = PaymentApproval::whereBetween('approved_at', [$startDateTime, $endDateTime])
            ->where('status', 'Paid')
            ->sum('approved_amount');

        // Simple Dispensing Revenue
        $simpleDispenseRevenue = Dispensed::whereBetween('created_at', [$startDateTime, $endDateTime])
            ->where('transaction_status', 'completed')
            ->sum('total_price');

        // Total Pharmacy Revenue (Complex + Simple)
        $totalPharmacyRevenue = $pharmacyRevenue + $simpleDispenseRevenue;

        // Wholesale Revenue
        $wholesaleRevenue = WholesalePayment::whereBetween('payment_date', [$startDateTime, $endDateTime])
            ->where('status', 'completed')
            ->sum('amount');

        // Expenses
        $expenses = FinancialActivity::whereBetween('transaction_date', [$startDateTime, $endDateTime])
            ->where('type', 'expense')
            ->sum('amount');

        // Income from Financial Activities
        $financialIncome = FinancialActivity::whereBetween('transaction_date', [$startDateTime, $endDateTime])
            ->where('type', 'income')
            ->sum('amount');

        $totalRevenue = $totalPharmacyRevenue + $wholesaleRevenue + $financialIncome;
        $netProfit = $totalRevenue - $expenses;

        return [
            'total_revenue' => $totalRevenue,
            'pharmacy_revenue' => $totalPharmacyRevenue,
            'complex_dispensing_revenue' => $pharmacyRevenue,
            'simple_dispensing_revenue' => $simpleDispenseRevenue,
            'wholesale_revenue' => $wholesaleRevenue,
            'financial_income' => $financialIncome,
            'total_expenses' => $expenses,
            'net_profit' => $netProfit,
            'profit_margin' => $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0,
            'transaction_count' => [
                'pharmacy_complex' => PaymentApproval::whereBetween('approved_at', [$startDateTime, $endDateTime])->count(),
                'pharmacy_simple' => Dispensed::whereBetween('created_at', [$startDateTime, $endDateTime])->count(),
                'wholesale' => WholesalePayment::whereBetween('payment_date', [$startDateTime, $endDateTime])->count(),
                'expenses' => FinancialActivity::whereBetween('transaction_date', [$startDateTime, $endDateTime])->where('type', 'expense')->count(),
            ],
        ];
    }

    private function getPharmacyTransactions($startDateTime, $endDateTime, $userId = null)
    {
        // Get Complex Dispensing transactions
        $complexQuery = PaymentApproval::with(['creator', 'approver', 'patient'])
            ->whereBetween('approved_at', [$startDateTime, $endDateTime]);

        if ($userId) {
            $complexQuery->where('created_by', $userId);
        }

        $complexTransactions = $complexQuery->orderBy('approved_at', 'desc')->get();

        $complexData = $complexTransactions->map(function ($transaction) {
            return [
                'id' => $transaction->Payment_ID,
                'transaction_id' => $transaction->transaction_ID,
                'patient_name' => $transaction->patient ? $transaction->patient->full_name : 'Unknown',
                'patient_phone' => $transaction->patient ? $transaction->patient->phone : 'N/A',
                'amount' => $transaction->approved_amount,
                'payment_method' => $transaction->approved_payment_method,
                'status' => $transaction->status,
                'approved_by' => $transaction->approver ? $transaction->approver->name : 'Unknown',
                'created_by' => $transaction->creator ? $transaction->creator->name : 'Unknown',
                'approved_at' => $transaction->approved_at,
                'type' => 'complex_dispensing',
            ];
        });

        // Get Simple Dispensing transactions
        $simpleQuery = Dispensed::whereBetween('created_at', [$startDateTime, $endDateTime]);

        if ($userId) {
            $simpleQuery->where('created_by', $userId);
        }

        $simpleTransactions = $simpleQuery->orderBy('created_at', 'desc')->get();

        $simpleData = $simpleTransactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'patient_name' => 'Passover Customer',
                'patient_phone' => 'N/A',
                'amount' => $transaction->total_price,
                'payment_method' => 'cash',
                'status' => $transaction->transaction_status,
                'approved_by' => 'Auto-approved',
                'created_by' => 'System',
                'approved_at' => $transaction->created_at,
                'type' => 'simple_dispensing',
            ];
        });

        // Combine and sort by date
        return $complexData->concat($simpleData)->sortByDesc('approved_at')->values();
    }

    private function getWholesaleTransactions($startDateTime, $endDateTime, $userId = null)
    {
        $query = WholesalePayment::with(['order', 'customer', 'order.customer'])
            ->whereBetween('payment_date', [$startDateTime, $endDateTime]);

        if ($userId) {
            $query->where('received_by', $userId);
        }

        $transactions = $query->orderBy('payment_date', 'desc')->get();

        return $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'payment_number' => $transaction->payment_number,
                'order_number' => $transaction->order ? $transaction->order->order_number : 'N/A',
                'customer_name' => $transaction->customer ? $transaction->customer->business_name : 'Unknown',
                'customer_contact' => $transaction->customer ? $transaction->customer->contact_person : 'N/A',
                'amount' => $transaction->amount,
                'payment_type' => $transaction->payment_type,
                'status' => $transaction->status,
                'payment_date' => $transaction->payment_date,
                'created_by' => $transaction->received_by,
                'type' => 'wholesale',
            ];
        });
    }

    private function getExpenses($startDateTime, $endDateTime, $userId = null)
    {
        $query = FinancialActivity::with(['creator', 'approver'])
            ->whereBetween('transaction_date', [$startDateTime, $endDateTime])
            ->where('type', 'expense');

        if ($userId) {
            $query->where('created_by', $userId);
        }

        $expenses = $query->orderBy('transaction_date', 'desc')->get();

        return $expenses->map(function ($expense) {
            return [
                'id' => $expense->id,
                'transaction_id' => $expense->transaction_id,
                'category' => $expense->category,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'payment_method' => $expense->payment_method,
                'reference_number' => $expense->reference_number,
                'transaction_date' => $expense->transaction_date,
                'created_by' => $expense->creator ? $expense->creator->name : 'Unknown',
                'approved_by' => $expense->approver ? $expense->approver->name : 'Unknown',
                'status' => $expense->status,
                'type' => 'expense',
            ];
        });
    }

    private function getUserActivity($startDateTime, $endDateTime)
    {
        $users = User::with(['paymentApprovals', 'financialActivities', 'wholesalePayments'])
            ->whereHas('paymentApprovals', function ($query) use ($startDateTime, $endDateTime) {
                $query->whereBetween('approved_at', [$startDateTime, $endDateTime]);
            })
            ->orWhereHas('financialActivities', function ($query) use ($startDateTime, $endDateTime) {
                $query->whereBetween('transaction_date', [$startDateTime, $endDateTime]);
            })
            ->orWhereHas('wholesalePayments', function ($query) use ($startDateTime, $endDateTime) {
                $query->whereBetween('payment_date', [$startDateTime, $endDateTime]);
            })
            ->get();

        return $users->map(function ($user) use ($startDateTime, $endDateTime) {
            $pharmacyTransactions = $user->paymentApprovals()
                ->whereBetween('approved_at', [$startDateTime, $endDateTime])
                ->count();
            
            $pharmacyAmount = $user->paymentApprovals()
                ->whereBetween('approved_at', [$startDateTime, $endDateTime])
                ->sum('approved_amount');

            $expenses = $user->financialActivities()
                ->whereBetween('transaction_date', [$startDateTime, $endDateTime])
                ->where('type', 'expense')
                ->count();

            $expenseAmount = $user->financialActivities()
                ->whereBetween('transaction_date', [$startDateTime, $endDateTime])
                ->where('type', 'expense')
                ->sum('amount');

            $wholesaleTransactions = $user->wholesalePayments()
                ->whereBetween('payment_date', [$startDateTime, $endDateTime])
                ->count();

            $wholesaleAmount = $user->wholesalePayments()
                ->whereBetween('payment_date', [$startDateTime, $endDateTime])
                ->sum('amount');

            return [
                'user_id' => $user->id,
                'user_name' => $user->name ?? $user->username,
                'pharmacy_transactions' => $pharmacyTransactions,
                'pharmacy_amount' => $pharmacyAmount,
                'expenses_count' => $expenses,
                'expenses_amount' => $expenseAmount,
                'wholesale_transactions' => $wholesaleTransactions,
                'wholesale_amount' => $wholesaleAmount,
                'total_transactions' => $pharmacyTransactions + $expenses + $wholesaleTransactions,
                'total_amount' => $pharmacyAmount + $wholesaleAmount - $expenseAmount,
            ];
        });
    }

    private function getPaymentMethodsBreakdown($startDateTime, $endDateTime)
    {
        // Pharmacy payment methods
        $pharmacyMethods = PaymentApproval::whereBetween('approved_at', [$startDateTime, $endDateTime])
            ->where('status', 'Paid')
            ->select('approved_payment_method', DB::raw('count(*) as count'), DB::raw('sum(approved_amount) as amount'))
            ->groupBy('approved_payment_method')
            ->get();

        // Wholesale payment methods
        $wholesaleMethods = WholesalePayment::whereBetween('payment_date', [$startDateTime, $endDateTime])
            ->where('status', 'completed')
            ->select('payment_type', DB::raw('count(*) as count'), DB::raw('sum(amount) as amount'))
            ->groupBy('payment_type')
            ->get();

        // Expense payment methods
        $expenseMethods = FinancialActivity::whereBetween('transaction_date', [$startDateTime, $endDateTime])
            ->where('type', 'expense')
            ->select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(amount) as amount'))
            ->groupBy('payment_method')
            ->get();

        return [
            'pharmacy' => $pharmacyMethods,
            'wholesale' => $wholesaleMethods,
            'expenses' => $expenseMethods,
        ];
    }

    private function getDailyTrends($startDateTime, $endDateTime)
    {
        $days = [];
        $currentDate = Carbon::parse($startDateTime);
        $endDate = Carbon::parse($endDateTime);

        while ($currentDate <= $endDate) {
            $date = $currentDate->format('Y-m-d');
            
            $pharmacyRevenue = PaymentApproval::whereDate('approved_at', $date)
                ->where('status', 'Paid')
                ->sum('approved_amount');

            $wholesaleRevenue = WholesalePayment::whereDate('payment_date', $date)
                ->where('status', 'completed')
                ->sum('amount');

            $expenses = FinancialActivity::whereDate('transaction_date', $date)
                ->where('type', 'expense')
                ->sum('amount');

            $days[] = [
                'date' => $date,
                'pharmacy_revenue' => $pharmacyRevenue,
                'wholesale_revenue' => $wholesaleRevenue,
                'expenses' => $expenses,
                'net_revenue' => $pharmacyRevenue + $wholesaleRevenue - $expenses,
            ];

            $currentDate->addDay();
        }

        return $days;
    }

    private function getTopPerformers($startDateTime, $endDateTime)
    {
        // Top customers by spending
        $topCustomers = Patients::with(['paymentApprovals'])
            ->whereHas('paymentApprovals', function ($query) use ($startDateTime, $endDateTime) {
                $query->whereBetween('approved_at', [$startDateTime, $endDateTime])
                    ->where('status', 'Paid');
            })
            ->get()
            ->map(function ($customer) use ($startDateTime, $endDateTime) {
                $totalSpent = $customer->paymentApprovals()
                    ->whereBetween('approved_at', [$startDateTime, $endDateTime])
                    ->where('status', 'Paid')
                    ->sum('approved_amount');

                $transactionCount = $customer->paymentApprovals()
                    ->whereBetween('approved_at', [$startDateTime, $endDateTime])
                    ->where('status', 'Paid')
                    ->count();

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->full_name,
                    'phone' => $customer->phone,
                    'total_spent' => $totalSpent,
                    'transaction_count' => $transactionCount,
                    'average_transaction' => $transactionCount > 0 ? $totalSpent / $transactionCount : 0,
                ];
            })
            ->sortByDesc('total_spent')
            ->take(10)
            ->values();

        // Top wholesale customers
        $topWholesaleCustomers = WholesaleCustomer::with(['payments'])
            ->whereHas('payments', function ($query) use ($startDateTime, $endDateTime) {
                $query->whereBetween('payment_date', [$startDateTime, $endDateTime])
                    ->where('status', 'completed');
            })
            ->get()
            ->map(function ($customer) use ($startDateTime, $endDateTime) {
                $totalSpent = $customer->payments()
                    ->whereBetween('payment_date', [$startDateTime, $endDateTime])
                    ->where('status', 'completed')
                    ->sum('amount');

                $transactionCount = $customer->payments()
                    ->whereBetween('payment_date', [$startDateTime, $endDateTime])
                    ->where('status', 'completed')
                    ->count();

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->business_name,
                    'contact_person' => $customer->contact_person,
                    'phone' => $customer->phone_number,
                    'total_spent' => $totalSpent,
                    'transaction_count' => $transactionCount,
                    'average_transaction' => $transactionCount > 0 ? $totalSpent / $transactionCount : 0,
                ];
            })
            ->sortByDesc('total_spent')
            ->take(10)
            ->values();

        return [
            'pharmacy_customers' => $topCustomers,
            'wholesale_customers' => $topWholesaleCustomers,
        ];
    }

    private function getAuditTrail($startDateTime, $endDateTime, $userId = null)
    {
        $auditTrail = collect();

        // Pharmacy transactions
        $pharmacyTransactions = PaymentApproval::with(['creator', 'approver', 'patient'])
            ->whereBetween('approved_at', [$startDateTime, $endDateTime]);
        
        if ($userId) {
            $pharmacyTransactions->where('created_by', $userId);
        }

        $pharmacyTransactions->get()->each(function ($transaction) use ($auditTrail) {
            $auditTrail->push([
                'timestamp' => $transaction->approved_at,
                'action' => 'Payment Approved',
                'user' => $transaction->creator ? $transaction->creator->name : 'Unknown',
                'details' => "Approved payment of Tsh " . number_format($transaction->approved_amount) . " for " . ($transaction->patient ? $transaction->patient->full_name : 'Unknown'),
                'amount' => $transaction->approved_amount,
                'type' => 'pharmacy',
                'status' => $transaction->status,
            ]);
        });

        // Wholesale transactions
        $wholesaleTransactions = WholesalePayment::with(['order', 'customer'])
            ->whereBetween('payment_date', [$startDateTime, $endDateTime]);
        
        if ($userId) {
            $wholesaleTransactions->where('created_by', $userId);
        }

        $wholesaleTransactions->get()->each(function ($transaction) use ($auditTrail) {
            $auditTrail->push([
                'timestamp' => $transaction->payment_date,
                'action' => 'Wholesale Payment',
                'user' => $transaction->created_by,
                'details' => "Wholesale payment of Tsh " . number_format($transaction->amount) . " for " . ($transaction->customer ? $transaction->customer->business_name : 'Unknown'),
                'amount' => $transaction->amount,
                'type' => 'wholesale',
                'status' => $transaction->status,
            ]);
        });

        // Financial activities
        $financialActivities = FinancialActivity::with(['creator', 'approver'])
            ->whereBetween('transaction_date', [$startDateTime, $endDateTime]);
        
        if ($userId) {
            $financialActivities->where('created_by', $userId);
        }

        $financialActivities->get()->each(function ($activity) use ($auditTrail) {
            $auditTrail->push([
                'timestamp' => $activity->transaction_date,
                'action' => ucfirst($activity->type) . ' Recorded',
                'user' => $activity->creator ? $activity->creator->name : 'Unknown',
                'details' => ucfirst($activity->type) . " of Tsh " . number_format($activity->amount) . " - " . $activity->description,
                'amount' => $activity->type === 'expense' ? -$activity->amount : $activity->amount,
                'type' => $activity->type,
                'status' => $activity->status,
            ]);
        });

        return $auditTrail->sortByDesc('timestamp')->values();
    }
} 