<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispensed extends Model
{
    use HasFactory;
    protected $table = 'dispensed';

    protected $fillable = [
        'transaction_id',
        'transaction_status',
        'customer_id',
        'product_purchased',
        'product_quantity',
        'total_price',
        'created_by',
    ];
    protected $casts = [
        'product_purchased' => 'array',  
        'product_quantity' => 'array',   
        'total_price' => 'decimal:2',   
    ];
    public function paymentDetails()
    {
        return $this->hasOne(PaymentDetails::class, 'transaction_id', 'transaction_id');
    }
}



