<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;

// ============================================================================
// CONTROLLER IMPORTS
// ============================================================================
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
use App\Models\Branch;

// ============================================================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================================================

/**
 * Authentication Routes
 */
Route::post('/login', [LoginController::class, 'login'])->middleware('guest:sanctum');

// ============================================================================
// PROTECTED ROUTES (Authentication Required)
// ============================================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // ========================================================================
    // AUTHENTICATION & USER MANAGEMENT
    // ========================================================================
    
    /**
     * User Profile & Authentication
     */
    Route::get('/user', [LoginController::class, 'me']);
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully'], 200);
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
    
    /**
     * User Password Management
     */
    Route::post('/user/change-password', [\App\Http\Controllers\UserController::class, 'changePassword']);
    
    /**
     * User Subscriptions
     */
    Route::post('/users/{user}/subscribe', [SubscriptionController::class, 'subscribe']);
    Route::get('/users/{user}/subscription', [SubscriptionController::class, 'checkSubscription']);
    
    // ========================================================================
    // PHARMACY & BRANCH MANAGEMENT
    // ========================================================================
    
    /**
     * Pharmacy Management
     */
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
    
    /**
     * Branch Management
     */
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
    
    // ========================================================================
    // CORE BUSINESS LOGIC - CUSTOMERS & PATIENTS
    // ========================================================================
    
    /**
     * Customer/Patient Management
     */
    Route::apiResource('customers', PatientsController::class);
    
    /**
     * Customer Transactions & Reports
     */
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
    Route::get('/management-dashboard', [App\Http\Controllers\ManagementDashboardController::class, 'index']);

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
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/store-dashboard', [App\Http\Controllers\StoreDashboardController::class, 'index']);
});

// Stock Adjustment routes
Route::middleware('auth:sanctum')->group(function () {
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

Route::middleware(['auth:sanctum'])->group(function () {
    // Wholesale Customers
    Route::apiResource('wholesale/customers', App\Http\Controllers\WholesaleCustomerController::class);
    Route::get('/wholesale/customers/types', [App\Http\Controllers\WholesaleCustomerController::class, 'getCustomerTypes']);
    Route::get('/wholesale/customers/payment-terms', [App\Http\Controllers\WholesaleCustomerController::class, 'getPaymentTerms']);
    Route::post('/wholesale/customers/{id}/balance', [App\Http\Controllers\WholesaleCustomerController::class, 'updateBalance']);

    // Wholesale Orders
    Route::apiResource('wholesale/orders', App\Http\Controllers\WholesaleOrderController::class);
    Route::post('/wholesale/orders/{id}/confirm', [App\Http\Controllers\WholesaleOrderController::class, 'confirm']);
    Route::post('/wholesale/orders/{id}/cancel', [App\Http\Controllers\WholesaleOrderController::class, 'cancel']);
    Route::post('/wholesale/orders/{id}/process', [App\Http\Controllers\WholesaleOrderController::class, 'process']);
    Route::post('/wholesale/orders/{id}/ready-for-delivery', [App\Http\Controllers\WholesaleOrderController::class, 'readyForDelivery']);
    Route::post('/wholesale/orders/{id}/complete', [App\Http\Controllers\WholesaleOrderController::class, 'complete']);

    // Wholesale Deliveries
    Route::apiResource('wholesale/deliveries', App\Http\Controllers\WholesaleDeliveryController::class);
    Route::post('/wholesale/deliveries/{id}/in-transit', [App\Http\Controllers\WholesaleDeliveryController::class, 'markInTransit']);
    Route::post('/wholesale/deliveries/{id}/delivered', [App\Http\Controllers\WholesaleDeliveryController::class, 'markDelivered']);
    Route::post('/wholesale/deliveries/{id}/failed', [App\Http\Controllers\WholesaleDeliveryController::class, 'markFailed']);
    Route::get('/wholesale/deliveries/methods', [App\Http\Controllers\WholesaleDeliveryController::class, 'getDeliveryMethods']);

    // Wholesale Payments
    Route::apiResource('wholesale/payments', App\Http\Controllers\WholesalePaymentController::class);
    Route::post('/wholesale/payments/{id}/complete', [App\Http\Controllers\WholesalePaymentController::class, 'markCompleted']);
    Route::post('/wholesale/payments/{id}/fail', [App\Http\Controllers\WholesalePaymentController::class, 'markFailed']);
    Route::post('/wholesale/payments/{id}/refund', [App\Http\Controllers\WholesalePaymentController::class, 'markRefunded']);
    Route::post('/wholesale/payments/{id}/receipt', [App\Http\Controllers\WholesalePaymentController::class, 'generateReceipt']);
    Route::get('/wholesale/payments/methods', [App\Http\Controllers\WholesalePaymentController::class, 'getPaymentMethods']);

    // Wholesale Reports
    Route::get('/wholesale/reports/sales', [App\Http\Controllers\WholesaleReportController::class, 'sales']);
    Route::get('/wholesale/reports/customers', [App\Http\Controllers\WholesaleReportController::class, 'customers']);
    Route::get('/wholesale/reports/deliveries', [App\Http\Controllers\WholesaleReportController::class, 'deliveries']);
    Route::get('/wholesale/reports/payments', [App\Http\Controllers\WholesaleReportController::class, 'payments']);
    Route::get('/wholesale/reports/overdue', [App\Http\Controllers\WholesaleReportController::class, 'overdue']);
    Route::get('/wholesale/reports/dashboard', [App\Http\Controllers\WholesaleReportController::class, 'dashboard']);

    // Wholesale Products (for POS)
    Route::get('/wholesale/products', [App\Http\Controllers\WholesaleOrderController::class, 'getProducts']);
    Route::get('/wholesale/products/search', [App\Http\Controllers\WholesaleOrderController::class, 'searchProducts']);
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
