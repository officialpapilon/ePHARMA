<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Adjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 
        'batch_no', 
        'adjustment_date', 
        'adjustment_type', 
        'quantity_adjusted',
        'created_by'
    ];

    protected $casts = [
        'adjustment_date' => 'date',
        'quantity_adjusted' => 'integer',
    ];

    public function medicine()
    {
        return $this->belongsTo(MedicinesCache::class, 'product_id', 'product_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('adjustment_type', $type);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('adjustment_date', [$startDate, $endDate]);
    }

    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function getFormattedAdjustmentDateAttribute()
    {
        return $this->adjustment_date ? $this->adjustment_date->format('d/m/Y') : 'N/A';
    }

    public function getFormattedCreatedAtAttribute()
    {
        return $this->created_at ? $this->created_at->format('d/m/Y H:i') : 'N/A';
    }

    public function getAdjustmentTypeLabelAttribute()
    {
        $labels = [
            'increase' => 'Stock Increase',
            'decrease' => 'Stock Decrease',
            'transfer' => 'Transfer Out',
            'donation' => 'Donation',
        ];

        return $labels[$this->adjustment_type] ?? $this->adjustment_type;
    }

    public function getAdjustmentTypeColorAttribute()
    {
        $colors = [
            'increase' => 'success',
            'decrease' => 'error',
            'transfer' => 'info',
            'donation' => 'warning',
        ];

        return $colors[$this->adjustment_type] ?? 'default';
    }

    public function getTotalValueAttribute()
    {
        if ($this->medicine) {
            return $this->quantity_adjusted * floatval($this->medicine->product_price);
        }
        return 0;
    }

    public function getFormattedTotalValueAttribute()
    {
        return 'Tsh ' . number_format($this->total_value, 2);
    }
}

