<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'integer';

    protected $fillable = ['id', 'first_name', 'last_name', 'phone', 'address', 'age'];
}
