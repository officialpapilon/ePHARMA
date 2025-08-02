<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'payment_method',
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
        'due_date',
        'notes',
        'delivery_instructions',
        'delivery_address',
        'delivery_contact_person',
        'delivery_contact_phone',
        'inventory_reserved',
        'inventory_deducted',
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'expected_delivery_date' => 'datetime',
        'due_date' => 'datetime',
        'inventory_reserved' => 'boolean',
        'inventory_deducted' => 'boolean',
    ];

    // Workflow statuses
    const STATUS_PENDING_PAYMENT = 'pending_payment';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PROCESSING = 'processing';
    const STATUS_READY_FOR_DELIVERY = 'ready_for_delivery';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    // Payment statuses
    const PAYMENT_STATUS_PENDING = 'pending';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_PARTIAL = 'partial';
    const PAYMENT_STATUS_OVERDUE = 'overdue';

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

    // Scopes for workflow
    public function scopePendingPayment($query)
    {
        return $query->where('status', self::STATUS_PENDING_PAYMENT);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeReadyForDelivery($query)
    {
        return $query->where('status', self::STATUS_READY_FOR_DELIVERY);
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', self::STATUS_DELIVERED);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->where('payment_status', '!=', self::PAYMENT_STATUS_PAID);
    }

    // Workflow methods
    public function canProcessPayment()
    {
        return $this->status === self::STATUS_PENDING_PAYMENT && 
               $this->payment_status === self::PAYMENT_STATUS_PENDING;
    }

    public function canScheduleDelivery()
    {
        return $this->status === self::STATUS_CONFIRMED && 
               $this->payment_status === self::PAYMENT_STATUS_PAID;
    }

    public function canCompleteDelivery()
    {
        return $this->status === self::STATUS_READY_FOR_DELIVERY;
    }

    public function processPayment()
    {
        if (!$this->canProcessPayment()) {
            throw new \Exception('Order cannot be processed for payment');
        }

        $this->payment_status = self::PAYMENT_STATUS_PAID;
        $this->paid_amount = $this->total_amount;
        $this->balance_amount = 0;
        $this->status = self::STATUS_CONFIRMED;
        $this->save();

        return $this;
    }

    public function scheduleDelivery()
    {
        if (!$this->canScheduleDelivery()) {
            throw new \Exception('Order cannot be scheduled for delivery');
        }

        $this->status = self::STATUS_READY_FOR_DELIVERY;
        $this->save();

        return $this;
    }

    public function completeDelivery()
    {
        if (!$this->canCompleteDelivery()) {
            throw new \Exception('Order cannot be completed');
        }

        $this->status = self::STATUS_DELIVERED;
        $this->save();

        return $this;
    }
} 