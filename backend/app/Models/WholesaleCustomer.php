<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WholesaleCustomer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_code',
        'business_name',
        'contact_person',
        'phone_number',
        'email',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_number',
        'business_license',
        'customer_type',
        'credit_limit_type',
        'credit_limit',
        'current_balance',
        'payment_terms',
        'status',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'current_balance' => 'decimal:2',
    ];

    // Relationships
    public function orders()
    {
        return $this->hasMany(WholesaleOrder::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasMany(WholesalePayment::class, 'customer_id');
    }

    public function deliveries()
    {
        return $this->hasMany(WholesaleDelivery::class, 'customer_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('customer_type', $type);
    }

    // Methods
    public function getFullAddressAttribute()
    {
        $address = $this->address;
        if ($this->city) {
            $address .= ', ' . $this->city;
        }
        if ($this->state) {
            $address .= ', ' . $this->state;
        }
        if ($this->postal_code) {
            $address .= ' ' . $this->postal_code;
        }
        if ($this->country) {
            $address .= ', ' . $this->country;
        }
        return $address;
    }

    public function getAvailableCreditAttribute()
    {
        if ($this->credit_limit_type === 'unlimited') {
            return null; // Unlimited credit
        }
        return $this->credit_limit - $this->current_balance;
    }

    public function canPlaceOrder($amount)
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->credit_limit_type === 'unlimited') {
            return true;
        }

        return ($this->current_balance + $amount) <= $this->credit_limit;
    }

    public function updateBalance($amount)
    {
        $this->current_balance += $amount;
        $this->save();
    }

    // Boot method to generate customer code
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($customer) {
            if (empty($customer->customer_code)) {
                $customer->customer_code = 'CUST-' . date('Y') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
            }
        });
    }
}
