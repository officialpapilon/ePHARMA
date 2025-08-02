<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WholesaleDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_number',
        'order_id',
        'customer_id',
        'delivered_by',
        'status',
        'scheduled_date',
        'actual_delivery_date',
        'scheduled_time',
        'actual_delivery_time',
        'delivery_address',
        'contact_person',
        'contact_phone',
        'delivery_instructions',
        'notes',
        'vehicle_number',
        'driver_name',
        'driver_phone',
        'delivery_fee',
        'is_partial_delivery',
        'is_delivery_note_generated',
        'is_delivery_receipt_generated',
        'delivery_note_number',
        'delivery_receipt_number',
        'delivery_notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'actual_delivery_date' => 'date',
        'scheduled_time' => 'datetime',
        'actual_delivery_time' => 'datetime',
        'delivery_fee' => 'decimal:2',
        'is_partial_delivery' => 'boolean',
        'is_delivery_note_generated' => 'boolean',
        'is_delivery_receipt_generated' => 'boolean',
    ];

    // Delivery statuses
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAILED = 'failed';

    public function order()
    {
        return $this->belongsTo(WholesaleOrder::class, 'order_id');
    }

    public function customer()
    {
        return $this->belongsTo(WholesaleCustomer::class, 'customer_id');
    }

    public function deliveredBy()
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }
} 