<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockReceiving extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_name',
        'invoice_number',
        'delivery_date',
        'total_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(StockReceivingItem::class, 'receiving_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
} 