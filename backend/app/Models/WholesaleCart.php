<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WholesaleCart extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'cart_number',
        'customer_id',
        'created_by',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(WholesaleCustomer::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(WholesaleCartItem::class, 'cart_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
} 