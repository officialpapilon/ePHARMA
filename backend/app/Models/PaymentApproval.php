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
        'dispense_id',
        'created_by',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'created_by' => 'integer',
        'approved_by' => 'integer',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patients::class, 'Patient_ID', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'Patient_ID', 'id');
    }

    public function cart()
    {
        return $this->belongsTo(Carts::class, 'dispense_id', 'dispense_id');
    }
}
