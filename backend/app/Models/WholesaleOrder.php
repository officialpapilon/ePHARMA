<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class WholesaleOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'customer_id',
        'created_by',
        'order_type',
        'status',
        'payment_status',
        'payment_terms',
        'delivery_type',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_amount',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'order_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'due_date',
        'notes',
        'delivery_instructions',
        'invoice_number',
        'is_invoiced',
        'is_delivered',
        'is_payment_processed',
        'is_delivery_scheduled',
        'delivery_address',
        'delivery_contact_person',
        'delivery_contact_phone',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'due_date' => 'date',
        'is_invoiced' => 'boolean',
        'is_delivered' => 'boolean',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(WholesaleCustomer::class, 'customer_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(WholesaleOrderItem::class, 'order_id');
    }

    public function payments()
    {
        return $this->hasMany(WholesalePayment::class, 'order_id');
    }

    public function deliveries()
    {
        return $this->hasMany(WholesaleDelivery::class, 'order_id');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPaymentStatus($query, $status)
    {
        return $query->where('payment_status', $status);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('order_date', [$startDate, $endDate]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', Carbon::today())
                    ->where('payment_status', '!=', 'paid');
    }

    // Methods
    public function calculateTotals()
    {
        $subtotal = $this->items->sum('total');
        $taxAmount = $this->items->sum('tax_amount');
        $discountAmount = $this->items->sum('discount_amount');
        
        $this->subtotal = $subtotal;
        $this->tax_amount = $taxAmount;
        $this->discount_amount = $discountAmount;
        $this->total_amount = $subtotal + $taxAmount - $discountAmount + $this->shipping_amount;
        $this->balance_amount = $this->total_amount - $this->paid_amount;
        
        $this->save();
    }

    public function updatePaymentStatus()
    {
        if ($this->paid_amount >= $this->total_amount) {
            $this->payment_status = 'paid';
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'pending';
        }

        if ($this->due_date && Carbon::today()->gt($this->due_date) && $this->payment_status !== 'paid') {
            $this->payment_status = 'overdue';
        }

        $this->save();
    }

    public function canBeDelivered()
    {
        return in_array($this->status, ['confirmed', 'processing', 'ready_for_delivery']) &&
               ($this->payment_status === 'paid' || $this->payment_terms === 'pay_later');
    }

    public function canBeCancelled()
    {
        return in_array($this->status, ['draft', 'confirmed', 'processing']) &&
               $this->payment_status !== 'paid';
    }

    public function isOverdue()
    {
        return $this->due_date && $this->due_date < Carbon::today() && $this->payment_status !== 'paid';
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        return Carbon::today()->diffInDays($this->due_date);
    }

    // New methods for enhanced flow
    public function canBeProcessedForPayment()
    {
        return in_array($this->status, ['confirmed', 'processing']) && 
               !$this->is_payment_processed;
    }

    public function canBeScheduledForDelivery()
    {
        return ($this->payment_status === 'paid' || $this->payment_terms === 'pay_later') &&
               $this->delivery_type === 'delivery' &&
               !$this->is_delivery_scheduled;
    }

    public function isReadyForDelivery()
    {
        return $this->status === 'ready_for_delivery' && 
               $this->delivery_type === 'delivery';
    }

    public function markAsPaymentProcessed()
    {
        $this->update(['is_payment_processed' => true]);
    }

    public function markAsDeliveryScheduled()
    {
        $this->update(['is_delivery_scheduled' => true]);
    }

    public function generateInvoiceNumber()
    {
        $prefix = 'INV';
        $year = date('Y');
        $month = date('m');
        $lastInvoice = self::where('invoice_number', 'like', "{$prefix}{$year}{$month}%")
                           ->orderBy('invoice_number', 'desc')
                           ->first();
        
        if ($lastInvoice) {
            $lastNumber = intval(substr($lastInvoice->invoice_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . $year . $month . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    public function generateDeliveryNoteNumber()
    {
        $prefix = 'DN';
        $year = date('Y');
        $month = date('m');
        $lastNote = WholesaleDelivery::where('delivery_note_number', 'like', "{$prefix}{$year}{$month}%")
                                    ->orderBy('delivery_note_number', 'desc')
                                    ->first();
        
        if ($lastNote) {
            $lastNumber = intval(substr($lastNote->delivery_note_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . $year . $month . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    // Boot method to generate order number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = 'ORD-' . date('Y') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            }
            if (empty($order->order_date)) {
                $order->order_date = Carbon::today();
            }
        });
    }
}
