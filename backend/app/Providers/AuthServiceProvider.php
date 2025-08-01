<?php
namespace App\Providers;

use Laravel\Passport\Passport;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        Pharmacy::class => PharmacyPolicy::class,
        Branch::class => BranchPolicy::class,
    ];

    public function boot()
    {
        $this->registerPolicies();
        Passport::routes();
    }
}
