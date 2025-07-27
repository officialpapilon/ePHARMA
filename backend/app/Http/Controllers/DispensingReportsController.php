<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Dispensed;
use App\Models\PaymentApproval;
use App\Models\Patients;
use Carbon\Carbon;

class DispensingReportsController extends Controller
{
    public function trends(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $trends = PaymentApproval::selectRaw('
                DATE(created_at) as date,
                COUNT(*) as dispensings,
                SUM(approved_amount) as revenue
            ')
            ->where('status', 'approved')
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

            $activities = PaymentApproval::with(['customer', 'cart'])
                ->where('status', 'approved')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'type' => 'dispensing',
                        'description' => 'Dispensed to ' . ($payment->customer->name ?? 'Unknown Patient'),
                        'timestamp' => $payment->created_at,
                        'amount' => $payment->approved_amount
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
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get dispensing records
            $dispensings = PaymentApproval::with(['customer', 'cart'])
                ->where('status', 'approved')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'dispense_id' => $payment->dispense_id,
                        'patient_id' => $payment->Patient_ID,
                        'patient_name' => $payment->customer->name ?? 'Unknown Patient',
                        'products_dispensed' => $payment->cart->products ?? 'Unknown Products',
                        'total_amount' => $payment->approved_amount,
                        'dispensed_by' => $payment->created_by,
                        'dispensed_at' => $payment->created_at,
                        'status' => 'completed',
                        'payment_status' => 'paid',
                        'created_at' => $payment->created_at,
                        'updated_at' => $payment->updated_at
                    ];
                });

            // Calculate summary
            $summary = [
                'total_dispensings' => $dispensings->count(),
                'total_revenue' => $dispensings->sum('total_amount'),
                'pending_dispensings' => 0,
                'completed_dispensings' => $dispensings->count(),
                'cancelled_dispensings' => 0,
                'average_dispensing_value' => $dispensings->count() > 0 ? $dispensings->sum('total_amount') / $dispensings->count() : 0,
                'top_dispensing_products' => [],
                'dispensing_trends' => []
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'dispensings' => $dispensings,
                    'summary' => $summary
                ],
                'message' => 'Dispensing report data retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dispensing report data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 