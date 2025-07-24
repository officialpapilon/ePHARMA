<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicineDispenseValidation extends Model
{
    use HasFactory;

    protected $table = 'dispense_validation';

    protected $fillable = [
        'product_id',
        'Payment_ID',
        'Patient_ID',
        'quantity'
    ];

   
    protected $casts = [
        'quantity' => 'integer'
    ];
}