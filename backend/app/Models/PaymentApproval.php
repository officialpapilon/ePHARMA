<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentApproval extends Model
{
    use HasFactory;

    protected $table = 'payment_approval';

    protected $primaryKey = 'Payment_ID';

    protected $fillable = [
        'Patient_ID',
        'Product_ID',
        'transaction_ID',
        'status',
        'approved_by',
        'approved_at',
        'approved_quantity',
        'approved_amount',
        'approved_payment_method',
    ];
    

}
