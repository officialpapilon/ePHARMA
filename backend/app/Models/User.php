<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'first_name',
        'last_name',
        'phone_number',
        'address',
        'position',
        'email',
        'username',
        'password',
        'belonged_branches',
        'last_login_device',
        'last_login_at',
        'last_login_ip',
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

  
    public function getBelongedBranchesArray(): array
    {
        $branches = $this->belonged_branches;
    
        if (is_numeric($branches)) {
            return [(int)$branches];
        }
    
        if (is_array($branches)) {
            return array_map('intval', $branches);
        }
    
        if (is_string($branches)) {
            $decoded = json_decode($branches, true);
            return is_array($decoded) ? array_map('intval', $decoded) : [];
        }
    
        return [];
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