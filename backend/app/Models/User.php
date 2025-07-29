<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use App\Models\PaymentApproval;
use App\Models\FinancialActivity;
use App\Models\WholesalePayment;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'username',
        'password',
        'position',
        'phone_number',
        'address',
        'belonged_branches',
        'status',
        'last_login_at',
        'last_login_ip',
        'last_login_device',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'belonged_branches' => 'array', 
    ];

    public function subscription()
    {
        return $this->hasOne(Subscription::class);
    }

    public function pharmacies()
    {
        return $this->hasMany(Pharmacy::class);
    }

    public function paymentApprovals()
    {
        return $this->hasMany(PaymentApproval::class, 'created_by');
    }

    public function financialActivities()
    {
        return $this->hasMany(FinancialActivity::class, 'created_by');
    }

    public function wholesalePayments()
    {
        return $this->hasMany(WholesalePayment::class, 'received_by');
    }

    public function hasActiveSubscription()
    {
        return $this->subscription && $this->subscription->isActive();
    }

    public function belongsToBranch($branchId): bool
    {
        $branches = $this->getBelongedBranchesArray();
        
        return in_array((int)$branchId, $branches, true);
    }

   
    public function getActiveBranches()
    {
        $branches = $this->getBelongedBranchesArray();

        if (empty($branches)) {
            return collect();
        }

        return Branch::whereIn('id', $branches)
            ->where('is_active', true)
            ->get();
    }

  
    /**
     * Get belonged branches as array
     */
    public function getBelongedBranchesArray()
    {
        if (!$this->belonged_branches) {
            return [];
        }
        
        // If it's already an array (due to Laravel's array cast), return it
        if (is_array($this->belonged_branches)) {
            return $this->belonged_branches;
        }
        
        // If it's a string, decode it
        if (is_string($this->belonged_branches)) {
            $branches = json_decode($this->belonged_branches, true);
            return is_array($branches) ? $branches : [];
        }
        
        return [];
    }

    /**
     * Set belonged branches from array
     */
    public function setBelongedBranchesArray($branches)
    {
        $this->belonged_branches = is_array($branches) ? json_encode($branches) : null;
    }

  
    public function addBranch($branchId): bool
    {
        $branches = $this->getBelongedBranchesArray();
        $branchId = (int)$branchId;

        if (!in_array($branchId, $branches, true)) {
            $branches[] = $branchId;
            $this->belonged_branches = $branches;
            return true;
        }

        return false;
    }


    public function removeBranch($branchId): bool
    {
        $branches = $this->getBelongedBranchesArray();
        $branchId = (int)$branchId;

        $key = array_search($branchId, $branches, true);
        if ($key !== false) {
            unset($branches[$key]);
            $this->belonged_branches = array_values($branches); 
            return true;
        }

        return false;
    }
}