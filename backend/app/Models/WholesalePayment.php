<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class WholesalePayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'payment_number',
        'order_id',
        'customer_id',
        'received_by',
        'payment_type',
        'status',
        'payment_category',
        'amount',
        'amount_received',
        'reference_number',
        'bank_name',
        'account_number',
        'cheque_number',
        'payment_date',
        'due_date',
        'notes',
        'receipt_number',
        'is_receipt_generated',
        'is_invoice_generated',
        'invoice_number',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'payment_date' => 'date',
        'due_date' => 'date',
        'is_receipt_generated' => 'boolean',
        'is_invoice_generated' => 'boolean',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(WholesaleOrder::class, 'order_id');
    }

    public function customer()
    {
        return $this->belongsTo(WholesaleCustomer::class, 'customer_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPaymentType($query, $type)
    {
        return $query->where('payment_type', $type);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', Carbon::today())
                    ->where('status', 'pending');
    }

    // Methods
    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->amount_received = $this->amount;
        $this->save();

        // Update order payment status
        $this->order->paid_amount += $this->amount;
        $this->order->updatePaymentStatus();
        $this->order->save();

        // Update customer balance
        $this->customer->updateBalance(-$this->amount);
    }

    public function markAsFailed($reason = null)
    {
        $this->status = 'failed';
        if ($reason) {
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . "Failed: " . $reason;
        }
        $this->save();
    }

    public function markAsRefunded($reason = null)
    {
        $this->status = 'refunded';
        if ($reason) {
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . "Refunded: " . $reason;
        }
        $this->save();

        // Update order payment status
        $this->order->paid_amount -= $this->amount;
        $this->order->updatePaymentStatus();
        $this->order->save();

        // Update customer balance
        $this->customer->updateBalance($this->amount);
    }

    public function isOverdue()
    {
        return $this->due_date && Carbon::today()->gt($this->due_date) && $this->status === 'pending';
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        return Carbon::today()->diffInDays($this->due_date);
    }

    public function canBeRefunded()
    {
        return $this->status === 'completed';
    }

    public function generateReceiptNumber()
    {
        if (!$this->receipt_number) {
            $this->receipt_number = 'RCP-' . date('Y') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            $this->is_receipt_generated = true;
            $this->save();
        }
        return $this->receipt_number;
    }

    // Boot method to generate payment number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->payment_number)) {
                $payment->payment_number = 'PAY-' . date('Y') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            }
            if (empty($payment->payment_date)) {
                $payment->payment_date = Carbon::today();
            }
        });
    }
}
