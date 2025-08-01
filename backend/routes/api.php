<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;

use App\Http\Controllers\PatientsController;
use App\Http\Controllers\MedicinesController;
use App\Http\Controllers\CartsController;
use App\Http\Controllers\DispensedController;
use App\Http\Controllers\PatientRecordController;
use App\Http\Controllers\PaymentDetailController;
use App\Http\Controllers\StockTakingController;
use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\MedicinesCacheController;
use App\Http\Controllers\PaymentApprovalController;
use App\Http\Controllers\CustomerTransactionController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\PharmacyController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\PharmacySettingsController;
use App\Http\Controllers\DispensingReportController;
use App\Http\Controllers\Employees\UsersController;
use App\Http\Controllers\CashierDashboardController;
use App\Http\Controllers\FinancialActivityController;
use App\Http\Controllers\ManagementDashboardController;
use App\Http\Controllers\InventoryReportsController;
use App\Http\Controllers\PaymentReportsController;
use App\Http\Controllers\DispensingReportsController;
use App\Http\Controllers\StockReceivingController;
use App\Http\Controllers\FinancialAuditController;
use App\Models\Branch;

// Test endpoint for mobile app
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now(),
    ]);
});

Route::post('/login', [LoginController::class, 'login'])->middleware('guest:sanctum');

// Forgot Password Routes (no authentication required)
Route::post('/forgot-password', [LoginController::class, 'forgotPassword']);
Route::post('/reset-password', [LoginController::class, 'resetPassword']);
Route::post('/verify-reset-token', [LoginController::class, 'verifyResetToken']);



Route::middleware('auth')->group(function () {
    
    
  
    Route::get('/user', [LoginController::class, 'me']);
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully'], 200);
    });
    
    // Get all users for user management
    Route::get('/users', function (Request $request) {
        $users = \App\Models\User::select([
            'id', 'first_name', 'last_name', 'phone_number', 'address', 'position', 
            'email', 'username', 'status', 'belonged_branches', 'created_at', 
            'updated_at', 'last_login_device', 'last_login_at', 'last_login_ip'
        ])->get();
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    });
    
    /**
     * Employee Management
     */
    Route::prefix('employees')->group(function () {
        Route::get('/', [UsersController::class, 'index']);
        Route::post('/', [UsersController::class, 'store']);
        Route::get('/positions', [UsersController::class, 'getPositions']);
        Route::get('/{id}', [UsersController::class, 'show']);
        Route::put('/{id}', [UsersController::class, 'update']);
        Route::post('/{id}/toggle-status', [UsersController::class, 'toggleActive']);
        Route::post('/change-password', [UsersController::class, 'changePassword']);
    });
    
    Route::post('/user/change-password', [\App\Http\Controllers\UserController::class, 'changePassword']);
    
   
    Route::post('/users/{user}/subscribe', [SubscriptionController::class, 'subscribe']);
    Route::get('/users/{user}/subscription', [SubscriptionController::class, 'checkSubscription']);
    
   
    Route::prefix('pharmacies')->group(function () {
        Route::get('/', [PharmacyController::class, 'index']);
        Route::post('/', [PharmacyController::class, 'store'])
            ->middleware('can:create,App\Models\Pharmacy');
        Route::get('/{pharmacy}', [PharmacyController::class, 'show']);
        Route::put('/{pharmacy}', [PharmacyController::class, 'update'])
            ->middleware('can:update,pharmacy');
        Route::delete('/{pharmacy}', [PharmacyController::class, 'destroy'])
            ->middleware('can:delete,pharmacy');
        
        // Branch Management within Pharmacies
        Route::get('/{pharmacy}/branches', [BranchController::class, 'index'])
            ->middleware('can:viewAny,'.Branch::class);
        Route::post('/{pharmacy}/branches', [BranchController::class, 'store'])
            ->middleware('can:create,'.Branch::class);
    });
    
    //Branch Management
    Route::prefix('branches')->group(function () {
        Route::get('/{branch}', [BranchController::class, 'show'])
            ->middleware('can:view,branch');
        Route::put('/{branch}', [BranchController::class, 'update'])
            ->middleware('can:update,branch');
        Route::delete('/{branch}', [BranchController::class, 'destroy'])
            ->middleware('can:delete,branch');
        Route::post('/{branch}/activate', [BranchController::class, 'activate'])
            ->middleware('can:activate,branch');
        Route::post('/{branch}/deactivate', [BranchController::class, 'deactivate'])
            ->middleware('can:deactivate,branch');
    });
    
 
   //Customer/Patient Management
    
    Route::apiResource('customers', PatientsController::class);
    
    //Customer Transactions & Reports
    
    Route::prefix('customers')->group(function () {
        Route::get('/{customerId}/transactions', [CustomerTransactionController::class, 'getCustomerTransactions']);
        Route::get('/{customerId}/transaction-summary', [CustomerTransactionController::class, 'getCustomerTransactionSummary']);
    });
    Route::get('/customers-with-transactions', [CustomerTransactionController::class, 'customersWithTransactionSummary']);
    Route::get('/customer-transactions', [CustomerTransactionController::class, 'index']);
    
    // ========================================================================
    // INVENTORY & MEDICINE MANAGEMENT
    // ========================================================================
    
    /**
     * Medicine Management
     */
    Route::apiResource('medicines', MedicinesController::class);
    Route::apiResource('medicines-cache', MedicinesCacheController::class);
    Route::put('dispense/{id}', [MedicinesCacheController::class, 'update']);
    
    /**
     * Stock Management
     */
    Route::apiResource('stock-taking', StockTakingController::class);
    
    // Stock Adjustment routes
    Route::get('/stock-adjustments', [StockAdjustmentController::class, 'index']);
    Route::post('/stock-adjustments', [StockAdjustmentController::class, 'store']);
    Route::get('/stock-adjustments/transfers', [StockAdjustmentController::class, 'getTransfers']);
    Route::get('/stock-adjustments/type/{type}', [StockAdjustmentController::class, 'getAdjustmentsByType']);
    Route::get('/stock-adjustments/{id}', [StockAdjustmentController::class, 'show']);
    Route::put('/stock-adjustments/{id}', [StockAdjustmentController::class, 'update']);
    Route::delete('/stock-adjustments/{id}', [StockAdjustmentController::class, 'destroy']);
    
    // ========================================================================
    // SALES & TRANSACTION MANAGEMENT
    // ========================================================================
    
    /**
     * Cart & Shopping Management
     */
    Route::apiResource('carts', CartsController::class);
    
    /**
     * Payment Management
     */
    Route::apiResource('payment-details', PaymentDetailController::class);
    Route::resource('payment-approve', PaymentApprovalController::class);
    
    /**
     * Dispensing Management
     */
    Route::apiResource('dispensed', DispensedController::class);
    Route::get('/dispensed-statistics', [DispensedController::class, 'statistics']);
    Route::post('/dispense/{dispenseId}', [DispensedController::class, 'dispenseByDispenseId']);
    
    // ========================================================================
    // REPORTS & ANALYTICS
    // ========================================================================
    
    /**
     * Dispensing Reports
     */
    Route::get('/dispensing-report', [DispensingReportController::class, 'index']);
    Route::get('/payment-methods', [DispensingReportController::class, 'paymentMethods']);

    // MANAGEMENT DASHBOARD & REPORTS
    // Route::get('/management-dashboard', [App\Http\Controllers\ManagementDashboardController::class, 'index']);

    // INVENTORY REPORTS
    Route::get('/inventory-reports', [App\Http\Controllers\InventoryReportsController::class, 'index']);
    Route::get('/inventory-reports/stock-movements', [App\Http\Controllers\InventoryReportsController::class, 'stockMovements']);
    Route::get('/inventory-reports/expiring-products', [App\Http\Controllers\InventoryReportsController::class, 'expiringProducts']);
    Route::get('/inventory-reports/profit-analysis', [App\Http\Controllers\InventoryReportsController::class, 'profitAnalysis']);

    // PAYMENT REPORTS
    Route::get('/payment-reports', [App\Http\Controllers\PaymentReportsController::class, 'index']);
    Route::get('/payment-reports/revenue-analytics', [App\Http\Controllers\PaymentReportsController::class, 'revenueAnalytics']);
    Route::get('/payment-reports/customer-history', [App\Http\Controllers\PaymentReportsController::class, 'customerPaymentHistory']);
    
    /**
     * Cashier Dashboard
     */
    Route::get('/cashier-dashboard', [CashierDashboardController::class, 'index']);
    
    // ========================================================================
    // FINANCIAL MANAGEMENT
    // ========================================================================
    
    /**
     * Financial Activities
     */
    Route::prefix('financial-activities')->group(function () {
        Route::get('/summary', [FinancialActivityController::class, 'summary']);
        Route::get('/dashboard', [FinancialActivityController::class, 'dashboard']);
        Route::get('/categories', [FinancialActivityController::class, 'categories']);
        Route::post('/categories', [FinancialActivityController::class, 'addCategory']);
    });
    Route::apiResource('financial-activities', FinancialActivityController::class);
    
    // ========================================================================
    // SYSTEM SETTINGS & CONFIGURATION
    // ========================================================================
    
    /**
     * Pharmacy Settings
     */
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
    
    // ========================================================================
    // FILE & MEDIA MANAGEMENT
    // ========================================================================
    
    /**
     * File Storage & Media
     */
    Route::get('/storage/pharmacy_images/{filename}', function ($filename) {
        $path = storage_path('app/public/pharmacy_images/' . $filename);
        
        if (!File::exists($path)) {
            abort(404);
        }

        $file = File::get($path);
        $type = File::mimeType($path);

        return response($file, 200)->header('Content-Type', $type);
    });
    
    // ========================================================================
    // LEGACY & DEPRECATED ROUTES
    // ========================================================================
    
    /**
     * @deprecated These routes are kept for backward compatibility
     * Consider migrating to newer endpoints
     */
    // Route::apiResource('patient-records', PatientRecordController::class);
    // Route::apiResource('receipts', ReceiptController::class);
});

// Store Dashboard routes
Route::middleware('auth')->group(function () {
    Route::get('/store-dashboard', [App\Http\Controllers\StoreDashboardController::class, 'index']);
});

// Stock Adjustment routes
Route::middleware('auth')->group(function () {
    Route::get('/stock-adjustments', [App\Http\Controllers\StockAdjustmentController::class, 'index']);
    Route::post('/stock-adjustments', [App\Http\Controllers\StockAdjustmentController::class, 'store']);
    Route::get('/stock-adjustments/{id}', [App\Http\Controllers\StockAdjustmentController::class, 'show']);
    Route::put('/stock-adjustments/{id}', [App\Http\Controllers\StockAdjustmentController::class, 'update']);
    Route::delete('/stock-adjustments/{id}', [App\Http\Controllers\StockAdjustmentController::class, 'destroy']);
    Route::get('/stock-adjustments/transfers', [App\Http\Controllers\StockAdjustmentController::class, 'getTransfers']);
    Route::get('/stock-adjustments/type/{type}', [App\Http\Controllers\StockAdjustmentController::class, 'getAdjustmentsByType']);
});

// Stock Receiving Routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/stock-receiving', [App\Http\Controllers\StockReceivingController::class, 'index']);
    Route::post('/stock-receiving', [App\Http\Controllers\StockReceivingController::class, 'store']);
    Route::get('/stock-receiving/{id}', [App\Http\Controllers\StockReceivingController::class, 'show']);
});

// Management Dashboard Routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/management-dashboard', [App\Http\Controllers\ManagementDashboardController::class, 'index']);
    Route::get('/inventory-reports/stock-movements', [App\Http\Controllers\InventoryReportsController::class, 'stockMovements']);
    Route::get('/inventory-reports/stock-status', [App\Http\Controllers\InventoryReportsController::class, 'stockStatus']);
    Route::get('/payment-reports/revenue-analytics', [App\Http\Controllers\PaymentReportsController::class, 'revenueAnalytics']);
    Route::get('/payment-reports/customer-insights', [App\Http\Controllers\PaymentReportsController::class, 'customerInsights']);
    Route::get('/dispensing-reports/trends', [App\Http\Controllers\DispensingReportsController::class, 'trends']);
    Route::get('/dispensing-reports/activities', [App\Http\Controllers\DispensingReportsController::class, 'activities']);
    Route::get('/financial-audit', [FinancialAuditController::class, 'index']);
});

// Dispensing Reports Routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/dispensing-reports', [App\Http\Controllers\DispensingReportsController::class, 'index']);
    Route::get('/dispensing-reports/trends', [App\Http\Controllers\DispensingReportsController::class, 'trends']);
    Route::get('/dispensing-reports/activities', [App\Http\Controllers\DispensingReportsController::class, 'activities']);
});

// ============================================================================
// WHOLESALE ROUTES
// ============================================================================

Route::prefix('wholesale')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\WholesaleController::class, 'dashboard']);
    
    // Products and Customers
    Route::get('/products', [App\Http\Controllers\WholesaleController::class, 'getProducts']);
    Route::get('/customers', [App\Http\Controllers\WholesaleController::class, 'getCustomers']);
    Route::get('/reports', [App\Http\Controllers\WholesaleController::class, 'getReports']);
    
    // Orders
    Route::get('/orders', [App\Http\Controllers\WholesaleController::class, 'getOrders']);
    Route::post('/create-order', [App\Http\Controllers\WholesaleController::class, 'createOrder']);
    Route::post('/orders/{id}/process-payment', [App\Http\Controllers\WholesaleController::class, 'processPayment']);
    Route::post('/orders/{id}/schedule-delivery', [App\Http\Controllers\WholesaleController::class, 'scheduleDelivery']);
    Route::post('/orders/{id}/complete-delivery', [App\Http\Controllers\WholesaleController::class, 'completeDelivery']);
    Route::get('/deliveries', [App\Http\Controllers\WholesaleController::class, 'getDeliveries']);
    Route::post('/deliveries/{id}/complete', [App\Http\Controllers\WholesaleController::class, 'completeDeliveryWithDetails']);
    Route::post('/deliveries/{id}/generate-note', [App\Http\Controllers\WholesaleController::class, 'generateDeliveryNote']);
    Route::post('/customers', [App\Http\Controllers\WholesaleController::class, 'createCustomer']);
    Route::put('/customers/{id}', [App\Http\Controllers\WholesaleController::class, 'updateCustomer']);
    Route::post('/customers/{id}/deactivate', [App\Http\Controllers\WholesaleController::class, 'deactivateCustomer']);
    Route::get('/customers/{id}/transactions', [App\Http\Controllers\WholesaleController::class, 'getCustomerTransactions']);
    Route::post('/customers/{id}/clear-debt', [App\Http\Controllers\WholesaleController::class, 'clearCustomerDebt']);
});

// ============================================================================
// ROUTE DOCUMENTATION
// ============================================================================

/**
 * API ROUTE SUMMARY:
 * 
 * AUTHENTICATION:
 * - POST /api/login - User login
 * - POST /api/logout - User logout
 * - GET /api/user - Get current user profile
 * 
 * EMPLOYEE MANAGEMENT:
 * - GET /api/employees - List employees
 * - POST /api/employees - Create employee
 * - GET /api/employees/{id} - Get employee details
 * - PUT /api/employees/{id} - Update employee
 * - POST /api/employees/{id}/toggle-status - Toggle employee status
 * - POST /api/employees/change-password - Change employee password
 * 
 * CUSTOMER MANAGEMENT:
 * - GET /api/customers - List customers
 * - POST /api/customers - Create customer
 * - GET /api/customers/{id} - Get customer details
 * - PUT /api/customers/{id} - Update customer
 * - DELETE /api/customers/{id} - Delete customer
 * - GET /api/customers/{id}/transactions - Get customer transactions
 * 
 * INVENTORY MANAGEMENT:
 * - GET /api/medicines - List medicines
 * - POST /api/medicines - Create medicine
 * - GET /api/medicines-cache - List medicine cache
 * - PUT /api/dispense/{id} - Update medicine dispense
 * 
 * SALES & TRANSACTIONS:
 * - GET /api/carts - List carts
 * - POST /api/carts - Create cart
 * - GET /api/payment-approve - List payment approvals
 * - POST /api/payment-approve - Create payment approval
 * - POST /api/dispense/{dispenseId} - Dispense medicine
 * 
 * REPORTS & ANALYTICS:
 * - GET /api/dispensing-report - Get dispensing report
 * - GET /api/cashier-dashboard - Get cashier dashboard
 * - GET /api/financial-activities/summary - Get financial summary
 * 
 * SETTINGS:
 * - GET /api/settings/pharmacy - Get pharmacy settings
 * - POST /api/settings/pharmacy/info - Update pharmacy info
 */
