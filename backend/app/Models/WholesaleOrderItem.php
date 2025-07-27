<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WholesaleOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'batch_no',
        'product_name',
        'product_category',
        'quantity_ordered',
        'quantity_delivered',
        'unit_price',
        'wholesale_price',
        'discount_percentage',
        'discount_amount',
        'tax_percentage',
        'tax_amount',
        'subtotal',
        'total',
        'notes',
    ];

    protected $casts = [
        'quantity_ordered' => 'integer',
        'quantity_delivered' => 'integer',
        'unit_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(WholesaleOrder::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(MedicinesCache::class, 'product_id', 'product_id');
    }

    // Methods
    public function calculateTotals()
    {
        // Calculate subtotal
        $this->subtotal = $this->quantity_ordered * $this->wholesale_price;
        
        // Calculate discount
        $this->discount_amount = ($this->subtotal * $this->discount_percentage) / 100;
        
        // Calculate tax
        $taxableAmount = $this->subtotal - $this->discount_amount;
        $this->tax_amount = ($taxableAmount * $this->tax_percentage) / 100;
        
        // Calculate total
        $this->total = $this->subtotal - $this->discount_amount + $this->tax_amount;
        
        // Don't call save() here to avoid infinite loop
    }

    public function getRemainingQuantityAttribute()
    {
        return $this->quantity_ordered - $this->quantity_delivered;
    }

    public function isFullyDelivered()
    {
        return $this->quantity_delivered >= $this->quantity_ordered;
    }

    public function canBeDelivered($quantity)
    {
        return $quantity <= $this->remaining_quantity;
    }

    public function updateDeliveredQuantity($quantity)
    {
        $this->quantity_delivered += $quantity;
        $this->save();
    }

    // Boot method to calculate totals on creation/update
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            // Only calculate totals if the relevant fields have changed
            if ($item->isDirty(['quantity_ordered', 'wholesale_price', 'discount_percentage', 'tax_percentage'])) {
                $item->calculateTotals();
            }
        });
    }
}
