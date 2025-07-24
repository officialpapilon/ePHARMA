<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Carts extends Model
{
    use HasFactory;

    protected $primaryKey = 'transaction_ID';

    protected $fillable = [
         'patient_ID', 'product_purchased', 'total_price'
    ];

    protected $casts = [
        'product_purchased' => 'array', 
    ];
}
