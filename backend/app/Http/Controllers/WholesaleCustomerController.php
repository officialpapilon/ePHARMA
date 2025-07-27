<?php

namespace App\Http\Controllers;

use App\Models\WholesaleCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class WholesaleCustomerController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status');
            $customerType = $request->input('customer_type');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = WholesaleCustomer::query()
                ->with(['orders', 'payments']);

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('customer_code', 'like', "%{$search}%")
                      ->orWhere('business_name', 'like', "%{$search}%")
                      ->orWhere('contact_person', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%");
                });
            }

            // Apply status filter
            if ($status) {
                $query->where('status', $status);
            }

            // Apply customer type filter
            if ($customerType) {
                $query->where('customer_type', $customerType);
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $customers = $query->paginate($perPage);

            // Calculate summary statistics
            $summary = [
                'total_customers' => WholesaleCustomer::count(),
                'active_customers' => WholesaleCustomer::where('status', 'active')->count(),
                'total_credit_limit' => WholesaleCustomer::sum('credit_limit'),
                'total_current_balance' => WholesaleCustomer::sum('current_balance'),
                'customers_by_type' => WholesaleCustomer::select('customer_type', DB::raw('count(*) as count'))
                    ->groupBy('customer_type')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $customers->items(),
                'meta' => [
                    'current_page' => $customers->currentPage(),
                    'last_page' => $customers->lastPage(),
                    'per_page' => $customers->perPage(),
                    'total' => $customers->total(),
                    'from' => $customers->firstItem(),
                    'to' => $customers->lastItem(),
                ],
                'summary' => $summary,
                'message' => 'Customers retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'business_name' => 'required|string|max:255',
                'contact_person' => 'required|string|max:255',
                'phone_number' => 'required|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'required|string',
                'city' => 'required|string|max:255',
                'state' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'tax_number' => 'nullable|string|max:255',
                'business_license' => 'nullable|string|max:255',
                'customer_type' => 'required|in:pharmacy,hospital,clinic,distributor,other',
                'credit_limit_type' => 'required|in:unlimited,limited',
                'credit_limit' => 'required_if:credit_limit_type,limited|numeric|min:0',
                'payment_terms' => 'required|in:immediate,7_days,15_days,30_days,60_days',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer = WholesaleCustomer::create($request->all());

            return response()->json([
                'success' => true,
                'data' => $customer->load(['orders', 'payments']),
                'message' => 'Customer created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $customer = WholesaleCustomer::with([
                'orders' => function($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'payments' => function($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'deliveries' => function($query) {
                    $query->orderBy('created_at', 'desc');
                }
            ])->findOrFail($id);

            // Calculate customer statistics
            $stats = [
                'total_orders' => $customer->orders->count(),
                'total_payments' => $customer->payments->count(),
                'total_deliveries' => $customer->deliveries->count(),
                'total_spent' => $customer->orders->sum('total_amount'),
                'total_paid' => $customer->payments->where('status', 'completed')->sum('amount'),
                'outstanding_balance' => $customer->current_balance,
                'available_credit' => $customer->available_credit,
                'recent_orders' => $customer->orders->take(5),
                'recent_payments' => $customer->payments->take(5),
            ];

            return response()->json([
                'success' => true,
                'data' => $customer,
                'stats' => $stats,
                'message' => 'Customer details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'business_name' => 'sometimes|required|string|max:255',
                'contact_person' => 'sometimes|required|string|max:255',
                'phone_number' => 'sometimes|required|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'sometimes|required|string',
                'city' => 'sometimes|required|string|max:255',
                'state' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'tax_number' => 'nullable|string|max:255',
                'business_license' => 'nullable|string|max:255',
                'customer_type' => 'sometimes|required|in:pharmacy,hospital,clinic,distributor,other',
                'credit_limit_type' => 'sometimes|required|in:unlimited,limited',
                'credit_limit' => 'required_if:credit_limit_type,limited|numeric|min:0',
                'payment_terms' => 'sometimes|required|in:immediate,7_days,15_days,30_days,60_days',
                'status' => 'sometimes|required|in:active,inactive,suspended',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer->update($request->all());

            return response()->json([
                'success' => true,
                'data' => $customer->load(['orders', 'payments']),
                'message' => 'Customer updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($id);

            // Check if customer has any orders
            if ($customer->orders()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete customer with existing orders'
                ], 400);
            }

            $customer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getCustomerTypes()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'pharmacy' => 'Pharmacy',
                'hospital' => 'Hospital',
                'clinic' => 'Clinic',
                'distributor' => 'Distributor',
                'other' => 'Other'
            ]
        ]);
    }

    public function getPaymentTerms()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'immediate' => 'Immediate',
                '7_days' => '7 Days',
                '15_days' => '15 Days',
                '30_days' => '30 Days',
                '60_days' => '60 Days'
            ]
        ]);
    }

    public function updateBalance(Request $request, $id)
    {
        try {
            $customer = WholesaleCustomer::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer->updateBalance($request->amount);

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer balance updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer balance',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
