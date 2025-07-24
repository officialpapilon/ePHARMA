<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\PatientsController;
use App\Http\Controllers\MedicinesController;
use App\Http\Controllers\CartsController;
use App\Http\Controllers\DispensedController;
use App\Http\Controllers\PatientRecordController;
use App\Http\Controllers\PaymentDetailController;
use App\Http\Controllers\StockTakingController;
use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\MedicinesCacheController;
use App\Http\Controllers\PaymentApprovalController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\PharmacyController;
use App\Http\Controllers\Employees\UsersController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\PharmacySettingsController;
use App\Http\Controllers\DispensingReportController;



Route::post('/login', [LoginController::class, 'login'])->middleware('guest:sanctum');
Route::post('/logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out successfully'], 200);
})->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->group(function () {
Route::prefix('employees')->group(function () {
    // Route::get('/', [UsersController::class, 'index']);
    // Route::post('/', [UsersController::class, 'store']);
    // Route::get('/{id}', [UsersController::class, 'show']);
    // Route::put('/{id}', [UsersController::class, 'update']);
    // Route::delete('/{id}', [UsersController::class, 'destroy']);
});
Route::post('/users/{user}/subscribe', [SubscriptionController::class, 'subscribe']);
Route::get('/users/{user}/subscription', [SubscriptionController::class, 'checkSubscription']);
Route::get('/pharmacies', [PharmacyController::class, 'index']);
Route::post('/pharmacies', [PharmacyController::class, 'store'])
->middleware('can:create,App\Models\Pharmacy');
Route::get('/pharmacies/{pharmacy}', [PharmacyController::class, 'show']);
Route::put('/pharmacies/{pharmacy}', [PharmacyController::class, 'update'])
->middleware('can:update,pharmacy');
Route::delete('/pharmacies/{pharmacy}', [PharmacyController::class, 'destroy'])
->middleware('can:delete,pharmacy');
Route::get('/pharmacies/{pharmacy}/branches', [BranchController::class, 'index'])
->middleware('can:viewAny,'.Branch::class);
Route::post('/pharmacies/{pharmacy}/branches', [BranchController::class, 'store'])
    ->middleware('can:create,'.Branch::class);
Route::get('/branches/{branch}', [BranchController::class, 'show'])
    ->middleware('can:view,branch');
Route::put('/branches/{branch}', [BranchController::class, 'update'])
    ->middleware('can:update,branch');
Route::delete('/branches/{branch}', [BranchController::class, 'destroy'])
    ->middleware('can:delete,branch');
Route::post('/branches/{branch}/activate', [BranchController::class, 'activate'])
    ->middleware('can:activate,branch');
Route::post('/branches/{branch}/deactivate', [BranchController::class, 'deactivate'])
    ->middleware('can:deactivate,branch');
Route::apiResource('customers', PatientsController::class);
Route::apiResource('medicines', MedicinesController::class);
Route::apiResource('stock-taking', StockTakingController::class);
Route::apiResource('carts', CartsController::class);
Route::apiResource('dispensed', DispensedController::class);
// Route::apiResource('patient-records', PatientRecordController::class);
Route::apiResource('payment-details', PaymentDetailController::class);
// Route::apiResource('receipts', ReceiptController::class);
Route::apiResource('stock-adjustments', AdjustmentController::class);
Route::apiResource('medicines-cache', MedicinesCacheController::class);
Route::put('dispense/{id}', [MedicinesCacheController::class, 'update']);
Route::resource('payment-approve', PaymentApprovalController::class);
Route::prefix('settings')->group(function () {
    Route::get('/pharmacy', [PharmacySettingsController::class, 'index']);
    Route::post('/pharmacy/info', [PharmacySettingsController::class, 'updateInfo']);
    Route::post('/pharmacy/dispensing', [PharmacySettingsController::class, 'updateDispensing']);
    Route::post('/pharmacy/upload-image', [PharmacySettingsController::class, 'uploadImage']);
    Route::post('/pharmacy/remove-image', [PharmacySettingsController::class, 'removeImage']);
    Route::post('/pharmacy/departments', [PharmacySettingsController::class, 'updateDepartments']);
    Route::post('/pharmacy/payment-options', [PharmacySettingsController::class, 'updatePaymentOptions']);
    Route::post('/pharmacy/reset', [PharmacySettingsController::class, 'resetToDefault']);
});
Route::get('/storage/pharmacy_images/{filename}', function ($filename) {
    $path = storage_path('app/public/pharmacy_images/' . $filename);
    
    if (!File::exists($path)) {
        abort(404);
    }

    $file = File::get($path);
    $type = File::mimeType($path);

    return response($file, 200)->header('Content-Type', $type);
});
Route::middleware('auth:sanctum')->get('/user', [LoginController::class, 'me']);
Route::get('/dispensing-report', [DispensingReportController::class, 'index']);
Route::get('/payment-methods', [DispensingReportController::class, 'paymentMethods']);
Route::post('logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out successfully'], 200);
});
});
