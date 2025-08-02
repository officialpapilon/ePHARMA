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
} 