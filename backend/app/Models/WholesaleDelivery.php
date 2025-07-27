<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class WholesaleDelivery extends Model
{
    use HasFactory, SoftDeletes;

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
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'actual_delivery_date' => 'date',
        'scheduled_time' => 'datetime',
        'actual_delivery_time' => 'datetime',
        'delivery_fee' => 'decimal:2',
        'is_partial_delivery' => 'boolean',
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

    public function deliveredBy()
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeScheduledForToday($query)
    {
        return $query->where('scheduled_date', Carbon::today())
                    ->where('status', 'scheduled');
    }

    public function scopeOverdue($query)
    {
        return $query->where('scheduled_date', '<', Carbon::today())
                    ->whereIn('status', ['scheduled', 'in_transit']);
    }

    // Methods
    public function markAsDelivered()
    {
        $this->status = 'delivered';
        $this->actual_delivery_date = Carbon::today();
        $this->actual_delivery_time = Carbon::now();
        $this->save();

        // Update order delivery status
        $this->order->is_delivered = true;
        $this->order->actual_delivery_date = Carbon::today();
        $this->order->save();
    }

    public function markAsInTransit()
    {
        $this->status = 'in_transit';
        $this->save();
    }

    public function markAsFailed($reason = null)
    {
        $this->status = 'failed';
        if ($reason) {
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . "Failed: " . $reason;
        }
        $this->save();
    }

    public function isOverdue()
    {
        return $this->scheduled_date < Carbon::today() && 
               in_array($this->status, ['scheduled', 'in_transit']);
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        return Carbon::today()->diffInDays($this->scheduled_date);
    }

    public function canBeDelivered()
    {
        return in_array($this->status, ['scheduled', 'in_transit']);
    }

    public function canBeCancelled()
    {
        return in_array($this->status, ['scheduled']);
    }

    // Boot method to generate delivery number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($delivery) {
            if (empty($delivery->delivery_number)) {
                $delivery->delivery_number = 'DEL-' . date('Y') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            }
        });
    }
}
