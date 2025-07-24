<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Branch;
use App\Models\Pharmacy;

class BranchPolicy
{
   
    public function viewAny(User $user, Pharmacy $pharmacy)
    {
        return $user->id === $pharmacy->user_id || $user->position === 'Super Admin';
    }

    
    public function create(User $user, Pharmacy $pharmacy)
    {
        return $user->position === 'Super Admin';
    }

   
    public function view(User $user, Branch $branch)
    {
        return $branch->pharmacy->user_id === $user->id && 
               $user->hasActiveSubscription();
    }

    
    public function update(User $user, Branch $branch)
    {
        return $user->position === 'Super Admin';
    }

    
    public function delete(User $user, Branch $branch)
    {
        return $user->position === 'Super Admin';
    }

    
    public function activate(User $user, Branch $branch)
    {
        return $user->position === 'Super Admin';
    }

   
    public function deactivate(User $user, Branch $branch)
    {
        return $user->position === 'Super Admin';
    }
}