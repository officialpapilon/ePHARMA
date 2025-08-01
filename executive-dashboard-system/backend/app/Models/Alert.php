<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'severity',
        'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean'
    ];
} 