<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Adjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 
        'batch_no', 
        'adjustment_date', 
        'adjustment_type', 
        'quantity_adjusted', 
        'created_by'
    ];
}

