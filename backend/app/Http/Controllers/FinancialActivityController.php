<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\FinancialActivity;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialActivityController extends Controller
{
    /**
     * Display a listing of financial activities
     */
    public function index(Request $request)
    {
        $query = FinancialActivity::with(['creator', 'approver']);

        // Apply filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        // Get summary data
        $summary = $this->getSummary($request->start_date, $request->end_date);

        $activities = $query->orderBy('transaction_date', 'desc')
                           ->orderBy('created_at', 'desc')
                           ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $activities->items(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * Store a newly created financial activity
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:income,expense,refund,adjustment',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,bank_transfer,mobile_money,card,other',
            'reference_number' => 'nullable|string|max:100',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Check if user is authenticated
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        $activity = FinancialActivity::create([
            'transaction_id' => FinancialActivity::generateTransactionId(),
            'type' => $request->type,
            'category' => $request->category,
            'description' => $request->description,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'reference_number' => $request->reference_number,
            'transaction_date' => $request->transaction_date,
            'notes' => $request->notes,
            'created_by' => $user->id,
            'status' => 'approved', // Auto-approve for now
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $activity->load(['creator', 'approver']),
            'message' => 'Financial activity created successfully',
        ], 201);
    }

    /**
     * Display the specified financial activity
     */
    public function show($id)
    {
        $activity = FinancialActivity::with(['creator', 'approver'])->find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Financial activity not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $activity,
        ]);
    }

    /**
     * Update the specified financial activity
     */
    public function update(Request $request, $id)
    {
        $activity = FinancialActivity::find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Financial activity not found',
            ], 404);
        }

        $request->validate([
            'type' => 'sometimes|in:income,expense,refund,adjustment',
            'category' => 'sometimes|string',
            'description' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0',
            'payment_method' => 'sometimes|in:cash,bank_transfer,mobile_money,card,other',
            'reference_number' => 'nullable|string|max:100',
            'transaction_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $activity->update($request->only([
            'type', 'category', 'description', 'amount', 'payment_method',
            'reference_number', 'transaction_date', 'notes'
        ]));

        return response()->json([
            'success' => true,
            'data' => $activity->load(['creator', 'approver']),
            'message' => 'Financial activity updated successfully',
        ]);
    }

    /**
     * Remove the specified financial activity
     */
    public function destroy($id)
    {
        $activity = FinancialActivity::find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Financial activity not found',
            ], 404);
        }

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Financial activity deleted successfully',
        ]);
    }

    /**
     * Get financial summary
     */
    public function summary(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth();
        $endDate = $request->end_date ?? Carbon::now()->endOfMonth();

        $summary = $this->getSummary($startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get financial dashboard data
     */
    public function dashboard(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth();
        $endDate = $request->end_date ?? Carbon::now()->endOfMonth();

        // Monthly data for chart
        $monthlyData = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();

            $income = FinancialActivity::getTotalIncome($monthStart, $monthEnd);
            $expenses = FinancialActivity::getTotalExpenses($monthStart, $monthEnd);
            $profit = $income - $expenses;

            $monthlyData[] = [
                'month' => $date->format('M Y'),
                'income' => (float)$income,
                'expenses' => (float)$expenses,
                'profit' => (float)$profit,
            ];
        }

        // Category breakdown
        $categoryBreakdown = FinancialActivity::approved()
            ->dateRange($startDate, $endDate)
            ->select('category', 'type', DB::raw('SUM(amount) as total'))
            ->groupBy('category', 'type')
            ->get()
            ->groupBy('type');

        $summary = $this->getSummary($startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'monthlyData' => $monthlyData,
                'categoryBreakdown' => $categoryBreakdown,
            ],
        ]);
    }

    /**
     * Get categories for dropdown (dynamic + predefined)
     */
    public function categories()
    {
        // Get existing categories from database
        $existingCategories = FinancialActivity::select('category', 'type')
            ->distinct()
            ->get()
            ->groupBy('type');

        // Predefined categories
        $predefinedCategories = [
            'income' => [
                'Sales Revenue' => 'Sales Revenue',
                'Service Fees' => 'Service Fees',
                'Consultation Fees' => 'Consultation Fees',
                'Other Income' => 'Other Income',
            ],
            'expense' => [
                'Operational Expenses' => 'Operational Expenses',
                'Rent & Utilities' => 'Rent & Utilities',
                'Salaries & Wages' => 'Salaries & Wages',
                'Inventory Purchase' => 'Inventory Purchase',
                'Marketing & Advertising' => 'Marketing & Advertising',
                'Maintenance & Repairs' => 'Maintenance & Repairs',
                'Insurance' => 'Insurance',
                'Taxes' => 'Taxes',
                'Office Supplies' => 'Office Supplies',
                'Transportation' => 'Transportation',
                'Professional Fees' => 'Professional Fees',
                'Other Expenses' => 'Other Expenses',
            ],
        ];

        // Merge predefined with existing categories
        $mergedCategories = [];
        foreach (['income', 'expense', 'refund', 'adjustment'] as $type) {
            $mergedCategories[$type] = [];
            
            // Add predefined categories
            if (isset($predefinedCategories[$type])) {
                $mergedCategories[$type] = array_merge($mergedCategories[$type], $predefinedCategories[$type]);
            }
            
            // Add existing categories from database
            if (isset($existingCategories[$type])) {
                foreach ($existingCategories[$type] as $category) {
                    $categoryName = $category->category;
                    if (!in_array($categoryName, array_values($mergedCategories[$type]))) {
                        $mergedCategories[$type][$categoryName] = $categoryName;
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $mergedCategories,
        ]);
    }

    /**
     * Add a new category
     */
    public function addCategory(Request $request)
    {
        $request->validate([
            'type' => 'required|in:income,expense,refund,adjustment',
            'category' => 'required|string|max:255',
        ]);

        // Check if category already exists
        $exists = FinancialActivity::where('type', $request->type)
            ->where('category', $request->category)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Category already exists',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Category added successfully',
            'data' => [
                'type' => $request->type,
                'category' => $request->category,
            ],
        ]);
    }

    /**
     * Private method to get summary data
     */
    private function getSummary($startDate = null, $endDate = null)
    {
        // Base query for filtering by date
        $baseQuery = FinancialActivity::approved();
        if ($startDate && $endDate) {
            $baseQuery->dateRange($startDate, $endDate);
        }

        // Calculate totals using separate queries
        $totalIncome = (clone $baseQuery)->income()->sum('amount');
        $totalExpenses = (clone $baseQuery)->expense()->sum('amount');
        $totalRefunds = (clone $baseQuery)->where('type', 'refund')->sum('amount');
        $transactionCount = (clone $baseQuery)->count();
        
        $netProfit = $totalIncome - $totalExpenses + $totalRefunds;
        $profitMargin = $totalIncome > 0 ? (($netProfit) / $totalIncome) * 100 : 0;

        return [
            'total_income' => (float)$totalIncome,
            'total_expenses' => (float)$totalExpenses,
            'total_refunds' => (float)$totalRefunds,
            'net_profit' => (float)$netProfit,
            'profit_margin' => round($profitMargin, 2),
            'transaction_count' => $transactionCount,
        ];
    }
} 