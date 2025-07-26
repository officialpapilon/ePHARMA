<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class FinancialActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'type',
        'category',
        'description',
        'amount',
        'payment_method',
        'reference_number',
        'transaction_date',
        'notes',
        'attachment_path',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeIncome($query)
    {
        return $query->where('type', 'income');
    }

    public function scopeExpense($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', Carbon::now()->month)
                    ->whereYear('transaction_date', Carbon::now()->year);
    }

    public function scopeThisYear($query)
    {
        return $query->whereYear('transaction_date', Carbon::now()->year);
    }

    // Methods
    public static function generateTransactionId()
    {
        $year = Carbon::now()->year;
        $lastTransaction = self::whereYear('created_at', $year)
                              ->orderBy('id', 'desc')
                              ->first();
        
        $sequence = $lastTransaction ? intval(substr($lastTransaction->transaction_id, -3)) + 1 : 1;
        
        return "FA-{$year}-" . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    public function getFormattedAmountAttribute()
    {
        return 'Tsh ' . number_format($this->amount, 2);
    }

    public function getTypeLabelAttribute()
    {
        return ucfirst($this->type);
    }

    public function getCategoryLabelAttribute()
    {
        $labels = [
            // Income categories
            'sales_revenue' => 'Sales Revenue',
            'service_fees' => 'Service Fees',
            'consultation_fees' => 'Consultation Fees',
            'other_income' => 'Other Income',
            // Expense categories
            'operational_expenses' => 'Operational Expenses',
            'rent_utilities' => 'Rent & Utilities',
            'salaries_wages' => 'Salaries & Wages',
            'inventory_purchase' => 'Inventory Purchase',
            'marketing_advertising' => 'Marketing & Advertising',
            'maintenance_repairs' => 'Maintenance & Repairs',
            'insurance' => 'Insurance',
            'taxes' => 'Taxes',
            'office_supplies' => 'Office Supplies',
            'transportation' => 'Transportation',
            'professional_fees' => 'Professional Fees',
            'other_expenses' => 'Other Expenses',
        ];
        
        return $labels[$this->category] ?? $this->category;
    }

    public function getPaymentMethodLabelAttribute()
    {
        $labels = [
            'cash' => 'Cash',
            'bank_transfer' => 'Bank Transfer',
            'mobile_money' => 'Mobile Money',
            'card' => 'Card',
            'other' => 'Other',
        ];
        
        return $labels[$this->payment_method] ?? $this->payment_method;
    }

    // Static calculation methods
    public static function getTotalIncome($startDate = null, $endDate = null)
    {
        $query = self::income()->approved();
        
        if ($startDate && $endDate) {
            $query->dateRange($startDate, $endDate);
        }
        
        return $query->sum('amount');
    }

    public static function getTotalExpenses($startDate = null, $endDate = null)
    {
        $query = self::expense()->approved();
        
        if ($startDate && $endDate) {
            $query->dateRange($startDate, $endDate);
        }
        
        return $query->sum('amount');
    }

    public static function getNetProfit($startDate = null, $endDate = null)
    {
        $income = self::getTotalIncome($startDate, $endDate);
        $expenses = self::getTotalExpenses($startDate, $endDate);
        
        return $income - $expenses;
    }

    public static function getProfitMargin($startDate = null, $endDate = null)
    {
        $income = self::getTotalIncome($startDate, $endDate);
        $expenses = self::getTotalExpenses($startDate, $endDate);
        
        if ($income == 0) return 0;
        
        return (($income - $expenses) / $income) * 100;
    }
} 