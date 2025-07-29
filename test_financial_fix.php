<?php

// Test script to verify financial activity creation and dashboard data
// This script should be run from the backend directory

require_once 'vendor/autoload.php';

use App\Models\FinancialActivity;
use App\Models\PaymentApproval;
use Carbon\Carbon;

echo "Testing Financial Activity Creation and Dashboard Data...\n\n";

// Test 1: Check if FinancialActivity model exists and can be used
try {
    $activities = FinancialActivity::count();
    echo "✓ FinancialActivity model is working. Total activities: {$activities}\n";
} catch (Exception $e) {
    echo "✗ FinancialActivity model error: " . $e->getMessage() . "\n";
}

// Test 2: Check PaymentApproval data
try {
    $payments = PaymentApproval::where('status', 'approved')->count();
    $paymentRevenue = PaymentApproval::where('status', 'approved')->sum('approved_amount');
    echo "✓ PaymentApproval data: {$payments} approved payments, Tsh " . number_format($paymentRevenue) . " revenue\n";
} catch (Exception $e) {
    echo "✗ PaymentApproval error: " . $e->getMessage() . "\n";
}

// Test 3: Check FinancialActivity data
try {
    $income = FinancialActivity::where('status', 'approved')->where('type', 'income')->sum('amount');
    $expenses = FinancialActivity::where('status', 'approved')->where('type', 'expense')->sum('amount');
    $netFinancial = $income - $expenses;
    echo "✓ FinancialActivity data: Tsh " . number_format($income) . " income, Tsh " . number_format($expenses) . " expenses, Net: Tsh " . number_format($netFinancial) . "\n";
} catch (Exception $e) {
    echo "✗ FinancialActivity calculation error: " . $e->getMessage() . "\n";
}

// Test 4: Simulate dashboard calculation
try {
    $now = Carbon::now();
    $startOfMonth = $now->copy()->startOfMonth();
    
    $monthlyPaymentRevenue = PaymentApproval::where('status', 'approved')
        ->whereBetween('created_at', [$startOfMonth, $now])
        ->sum('approved_amount');
    
    $monthlyFinancialIncome = FinancialActivity::where('status', 'approved')
        ->where('type', 'income')
        ->whereBetween('transaction_date', [$startOfMonth, $now])
        ->sum('amount');
    
    $monthlyFinancialExpenses = FinancialActivity::where('status', 'approved')
        ->where('type', 'expense')
        ->whereBetween('transaction_date', [$startOfMonth, $now])
        ->sum('amount');
    
    $totalMonthlyRevenue = $monthlyPaymentRevenue + $monthlyFinancialIncome - $monthlyFinancialExpenses;
    
    echo "✓ Dashboard calculation test:\n";
    echo "  - Monthly Payment Revenue: Tsh " . number_format($monthlyPaymentRevenue) . "\n";
    echo "  - Monthly Financial Income: Tsh " . number_format($monthlyFinancialIncome) . "\n";
    echo "  - Monthly Financial Expenses: Tsh " . number_format($monthlyFinancialExpenses) . "\n";
    echo "  - Total Monthly Revenue: Tsh " . number_format($totalMonthlyRevenue) . "\n";
} catch (Exception $e) {
    echo "✗ Dashboard calculation error: " . $e->getMessage() . "\n";
}

echo "\nTest completed!\n"; 