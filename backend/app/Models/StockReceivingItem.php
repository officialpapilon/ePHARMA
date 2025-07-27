<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockReceivingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'receiving_id',
        'product_id',
        'product_name',
        'batch_no',
        'quantity_received',
        'unit_price',
        'buying_price',
        'manufacture_date',
        'expire_date',
    ];

    protected $casts = [
        'quantity_received' => 'integer',
        'unit_price' => 'decimal:2',
        'buying_price' => 'decimal:2',
        'manufacture_date' => 'date',
        'expire_date' => 'date',
    ];

    public function receiving()
    {
        return $this->belongsTo(StockReceiving::class, 'receiving_id');
    }

    public function product()
    {
        return $this->belongsTo(Medicines::class, 'product_id', 'product_id');
    }
} 