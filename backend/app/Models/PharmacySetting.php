<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacySetting extends Model
{
    use HasFactory;

    protected $table = 'pharmacy_settings';

    protected $fillable = [
        'logo',
        'stamp',
        'pharmacy_name',
        'tin_number',
        'phone_number',
        'email',
        'departments',
        'payment_options',
        'mode',
        'dispense_by_dept',
        'show_expired',
        'show_prices',
        'default_dept'
    ];

    protected $casts = [
        'departments' => 'array',
        'payment_options' => 'array'
    ];

  
    public static function getSettings()
    {
        return self::firstOrCreate([], [
            'tin_number' => '',
            'phone_number' => '',
            'email' => '',
            'departments' => [],
            'payment_options' => []
        ]);
    }
}