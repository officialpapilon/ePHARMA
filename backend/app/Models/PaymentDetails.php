<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentDetails extends Model
{
    use HasFactory;


    protected $fillable = [
        'transaction_id', 'payment_status', 'payment_method', 'payed_amount', 
        'created_by', 'updated_by', 'customer_id'
    ];

    protected $casts = [
        'payed_amount' => 'decimal:2',  
    ];
}
