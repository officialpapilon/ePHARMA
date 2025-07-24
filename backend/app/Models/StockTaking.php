<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTaking extends Model
{
    use HasFactory;

    protected $fillable = [
        'products', 'created_by'
    ];
    protected $casts = [
        'products' => 'array', 
    ];
}
