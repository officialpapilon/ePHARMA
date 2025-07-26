<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\PaymentApproval;
use App\Observers\PaymentApprovalObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        PaymentApproval::observe(PaymentApprovalObserver::class);
    }
}
