<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patients extends Model
{
    use HasFactory;

    protected $table = 'patients';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'integer';

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'address',
        'age',
        'email',
        'gender',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $hidden = [];

    protected $casts = [];

    public function paymentApprovals()
    {
        return $this->hasMany(PaymentApproval::class, 'Patient_ID', 'id');
    }
}