<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Pharmacy;

class PharmacyPolicy
{
    public function view(User $user, Pharmacy $pharmacy)
    {
        return $user->id === $pharmacy->user_id || $user->position === 'Super Admin';
    }

    public function create(User $user)
    {
        return $user->hasActiveSubscription();
    }

    public function update(User $user, Pharmacy $pharmacy)
    {
        return $user->id === $pharmacy->user_id || $user->position === 'Super Admin';
    }

    public function delete(User $user, Pharmacy $pharmacy)
    {
        return $user->position === 'Super Admin';
    }
}