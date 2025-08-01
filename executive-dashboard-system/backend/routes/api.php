<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;

// Test endpoint
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Executive Dashboard API is working!',
        'timestamp' => now(),
    ]);
});

// Executive Dashboard Routes
Route::prefix('dashboard')->group(function () {
    Route::get('/overview', [DashboardController::class, 'overview']);
    Route::get('/financial-summary', [DashboardController::class, 'financialSummary']);
    Route::get('/inventory-status', [DashboardController::class, 'inventoryStatus']);
    Route::get('/employee-productivity', [DashboardController::class, 'employeeProductivity']);
    Route::get('/alerts', [DashboardController::class, 'alerts']);
}); 