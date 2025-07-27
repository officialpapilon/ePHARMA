<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicinesCache extends Model
{
    use HasFactory;
    

    protected $fillable = [
        'product_id',
        'batch_no',
        'product_name',
        'product_price',
        'buying_price',
        'product_category',
        'expire_date',
        'current_quantity',
        'quantity'
    ];

    protected $casts = [
        'expire_date' => 'date',
    ];
}