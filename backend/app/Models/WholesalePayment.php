<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WholesalePayment extends Model
{
    use HasFactory;

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
        'payment_date' => 'datetime',
        'due_date' => 'datetime',
        'is_receipt_generated' => 'boolean',
        'is_invoice_generated' => 'boolean',
    ];

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
} 