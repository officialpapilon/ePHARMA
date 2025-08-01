<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'position',
        'branch_id',
        'transactions_count',
        'total_sales',
        'status'
    ];

    protected $casts = [
        'total_sales' => 'decimal:2'
    ];
} 