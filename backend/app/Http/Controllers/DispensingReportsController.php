<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Dispensed;
use App\Models\PaymentApproval;
use App\Models\Patients;
use App\Models\User;
use Carbon\Carbon;

class DispensingReportsController extends Controller
{
    public function trends(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Unified trends from PaymentApproval table
            $trends = PaymentApproval::selectRaw('
                DATE(created_at) as date,
                COUNT(*) as dispensings,
                SUM(approved_amount) as revenue,
                SUM(CASE WHEN dispense_id LIKE "DISP-%" THEN 1 ELSE 0 END) as complex_count,
                SUM(CASE WHEN transaction_ID LIKE "SIMPLE-%" THEN 1 ELSE 0 END) as simple_count
            ')
            ->where('status', 'Paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $trends,
                'message' => 'Dispensing trends retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dispensing trends',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function activities(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Unified activities from PaymentApproval table
            $activities = PaymentApproval::with(['patient', 'approver'])
                ->where('status', 'Paid')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($payment) {
                    // Determine transaction type
                    $transactionType = 'complex_dispensing';
                    if (str_starts_with($payment->transaction_ID, 'SIMPLE-')) {
                        $transactionType = 'simple_dispensing';
                    }

                    // Get patient name
                    $patientName = 'Anonymous Customer';
                    $patient = null;
                    if ($payment->Patient_ID !== 'PASSOVER-CUSTOMER') {
                        $patient = Patients::find($payment->Patient_ID);
                        $patientName = $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'Unknown Patient';
                    }

                    return [
                        'id' => $payment->Payment_ID,
                        'type' => $transactionType,
                        'description' => ucfirst(str_replace('_', ' ', $transactionType)) . ' to ' . $patientName,
                        'timestamp' => $payment->created_at,
                        'amount' => $payment->approved_amount,
                        'dispense_id' => $payment->dispense_id,
                        'patient_name' => $patientName,
                        'payment_method' => $payment->approved_payment_method
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $activities,
                'message' => 'Dispensing activities retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dispensing activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');
            $status = $request->get('status');
            $paymentStatus = $request->get('payment_status');
            $transactionType = $request->get('transaction_type');
            $paymentMethod = $request->get('payment_method');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            // Build query for PaymentApproval table (unified source)
            $query = PaymentApproval::with(['patient', 'creator', 'approver'])
                ->where('status', 'Paid'); // Only paid transactions

            // Apply filters
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('dispense_id', 'like', "%{$search}%")
                      ->orWhere('transaction_ID', 'like', "%{$search}%")
                      ->orWhere('Patient_ID', 'like', "%{$search}%");
                });
            }

            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentMethod) {
                $query->where('approved_payment_method', $paymentMethod);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }

            // Apply transaction type filter
            if ($transactionType) {
                if ($transactionType === 'complex_dispensing') {
                    $query->where('dispense_id', 'like', 'DISP-%');
                } elseif ($transactionType === 'simple_dispensing') {
                    $query->where('transaction_ID', 'like', 'SIMPLE-%');
                }
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            // Get paginated results
            $paymentApprovals = $query->paginate($perPage, ['*'], 'page', $page);

            // Transform data for frontend
            $transformedData = collect($paymentApprovals->items())->map(function ($payment) {
                // Determine transaction type based on dispense_id or transaction_ID
                $transactionType = 'complex_dispensing';
                if (str_starts_with($payment->transaction_ID, 'SIMPLE-')) {
                    $transactionType = 'simple_dispensing';
                }

                // Get patient name
                $patientName = 'Passover Customer';
                $patient = null;
                if ($payment->Patient_ID !== 'PASSOVER-CUSTOMER') {
                    $patient = Patients::find($payment->Patient_ID);
                    $patientName = $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'Unknown Patient';
                }

                // Get dispensed by name
                $dispensedByName = 'Unknown';
                if ($payment->approved_by) {
                    $user = User::find($payment->approved_by);
                    $dispensedByName = $user ? ($user->first_name . ' ' . $user->last_name) : 'Unknown';
                }

                return [
                    'id' => $payment->Payment_ID,
                    'patient_id' => $payment->Patient_ID,
                    'patient_name' => $patientName,
                    'patient_phone' => $patient ? $patient->phone : 'N/A',
                    'total_amount' => $payment->approved_amount,
                    'dispensed_by' => $payment->approved_by,
                    'dispensed_by_name' => $dispensedByName,
                    'dispensed_at' => $payment->approved_at,
                    'status' => $payment->status,
                    'payment_status' => $payment->status,
                    'payment_method' => $payment->approved_payment_method,
                    'transaction_type' => $transactionType,
                    'created_at' => $payment->created_at,
                    'updated_at' => $payment->updated_at,
                ];
            });

            // Calculate summary statistics
            $summary = $this->calculateUnifiedSummary($query->get());

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'summary' => $summary,
                'meta' => [
                    'current_page' => $paymentApprovals->currentPage(),
                    'last_page' => $paymentApprovals->lastPage(),
                    'per_page' => $paymentApprovals->perPage(),
                    'total' => $paymentApprovals->total(),
                ],
                'message' => 'Dispensing reports retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DispensingReports index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dispensing reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function formatComplexProducts($products)
    {
        if (is_string($products)) {
            try {
                $products = json_decode($products, true);
            } catch (\Exception $e) {
                return $products;
            }
        }

        if (is_array($products)) {
            return implode(', ', array_map(function($product) {
                if (is_array($product)) {
                    $name = $product['product_name'] ?? $product['name'] ?? 'Unknown Product';
                    $quantity = $product['quantity'] ?? 1;
                    return "{$name} (Qty: {$quantity})";
                }
                return $product;
            }, $products));
        }

        return 'Unknown Products';
    }

    private function formatSimpleProducts($productPurchased, $productQuantity)
    {
        if (is_string($productPurchased)) {
            try {
                $productPurchased = json_decode($productPurchased, true);
            } catch (\Exception $e) {
                return $productPurchased;
            }
        }

        if (is_string($productQuantity)) {
            try {
                $productQuantity = json_decode($productQuantity, true);
            } catch (\Exception $e) {
                $productQuantity = [1];
            }
        }

        if (is_array($productPurchased) && is_array($productQuantity)) {
            $formattedProducts = [];
            foreach ($productPurchased as $index => $productId) {
                $quantity = $productQuantity[$index] ?? 1;
                $formattedProducts[] = "Product ID: {$productId} (Qty: {$quantity})";
            }
            return implode(', ', $formattedProducts);
        }

        return 'Unknown Products';
    }

    private function calculateUnifiedSummary($allPayments)
    {
        $totalDispensings = $allPayments->count();
        $totalRevenue = $allPayments->sum('approved_amount');
        $completedDispensings = $allPayments->where('status', 'Paid')->count();
        $pendingDispensings = $allPayments->where('status', 'Pending')->count();
        $cancelledDispensings = $allPayments->where('status', 'Cancelled')->count();

        // Calculate by transaction type
        $complexDispensings = $allPayments->filter(function ($payment) {
            return str_starts_with($payment->dispense_id, 'DISP-');
        });
        
        $simpleDispensings = $allPayments->filter(function ($payment) {
            return str_starts_with($payment->transaction_ID, 'SIMPLE-');
        });

        // Calculate trends (last 7 days)
        $trends = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dayPayments = $allPayments->filter(function ($payment) use ($date) {
                return $payment->created_at->format('Y-m-d') === $date;
            });
            
            $trends->push([
                'date' => $date,
                'dispensings' => $dayPayments->count(),
                'revenue' => $dayPayments->sum('approved_amount')
            ]);
        }

        return [
            'total_dispensings' => $totalDispensings,
            'total_revenue' => $totalRevenue,
            'pending_dispensings' => $pendingDispensings,
            'completed_dispensings' => $completedDispensings,
            'cancelled_dispensings' => $cancelledDispensings,
            'average_dispensing_value' => $totalDispensings > 0 ? $totalRevenue / $totalDispensings : 0,
            'top_dispensing_products' => [], // Could be enhanced later
            'dispensing_trends' => $trends,
            'complex_dispensing' => [
                'count' => $complexDispensings->count(),
                'revenue' => $complexDispensings->sum('approved_amount')
            ],
            'simple_dispensing' => [
                'count' => $simpleDispensings->count(),
                'revenue' => $simpleDispensings->sum('approved_amount')
            ],
            'wholesale' => [
                'count' => 0, // Could be enhanced later
                'revenue' => 0
            ]
        ];
    }
} 