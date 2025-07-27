<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Adjustment;
use App\Models\MedicinesCache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockAdjustmentController extends Controller
{
    public function index()
    {
        try {
            $adjustments = Adjustment::with('medicine')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $adjustments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock adjustments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|string',
                'batch_no' => 'required|string',
                'adjustment_type' => 'required|in:increase,decrease,transfer,donation',
                'quantity_adjusted' => 'required|integer|min:1',
                'reason' => 'required|string',
                'created_by' => 'required|string',
                'destination' => 'nullable|string',
                'recipient_name' => 'nullable|string',
                'recipient_contact' => 'nullable|string',
            ]);

            DB::beginTransaction();

            // Find the medicine in medicines-cache
            $medicine = MedicinesCache::where('product_id', $request->product_id)
                ->where('batch_no', $request->batch_no)
                ->first();
            
            if (!$medicine) {
                return response()->json([
                    'success' => false,
                    'message' => 'Medicine not found with this product ID and batch number'
                ], 404);
            }

            // Check if it's a decrease, transfer, or donation and if there's enough stock
            if (in_array($request->adjustment_type, ['decrease', 'transfer', 'donation'])) {
                if ($medicine->current_quantity < $request->quantity_adjusted) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient stock for adjustment. Available: ' . $medicine->current_quantity
                    ], 422);
                }
                
                // For transfers and donations, prevent if current quantity is 0
                if ($medicine->current_quantity === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot transfer or donate items with zero stock'
                    ], 422);
                }
            }

            // Create the adjustment record using existing table structure
            $adjustment = Adjustment::create([
                'product_id' => $request->product_id,
                'batch_no' => $request->batch_no,
                'adjustment_date' => $request->adjustment_date ?? Carbon::now()->format('Y-m-d'),
                'adjustment_type' => $request->adjustment_type,
                'quantity_adjusted' => $request->quantity_adjusted,
                'created_by' => $request->created_by,
            ]);

            // Update medicine stock in medicines-cache
            if ($request->adjustment_type === 'increase') {
                $medicine->current_quantity += $request->quantity_adjusted;
            } elseif (in_array($request->adjustment_type, ['decrease', 'transfer', 'donation'])) {
                $medicine->current_quantity -= $request->quantity_adjusted;
                // Ensure quantity doesn't go below 0
                if ($medicine->current_quantity < 0) {
                    $medicine->current_quantity = 0;
                }
            }
            
            $medicine->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment created successfully',
                'data' => $adjustment
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create stock adjustment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $adjustment = Adjustment::with('medicine')->find($id);
            
            if (!$adjustment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock adjustment not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $adjustment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock adjustment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $adjustment = Adjustment::find($id);
            
            if (!$adjustment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock adjustment not found'
                ], 404);
            }

            $request->validate([
                'adjustment_reason' => 'sometimes|string',
            ]);

            $adjustment->update($request->only([
                'adjustment_reason'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment updated successfully',
                'data' => $adjustment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stock adjustment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $adjustment = Adjustment::find($id);
            
            if (!$adjustment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock adjustment not found'
                ], 404);
            }

            // Reverse the stock adjustment in medicines-cache
            $medicine = MedicinesCache::where('product_id', $adjustment->product_id)
                ->where('batch_no', $adjustment->batch_no)
                ->first();
            
            if ($medicine) {
                if ($adjustment->adjustment_type === 'increase') {
                    $medicine->current_quantity -= $adjustment->quantity_adjusted;
                } elseif (in_array($adjustment->adjustment_type, ['decrease', 'transfer', 'donation'])) {
                    $medicine->current_quantity += $adjustment->quantity_adjusted;
                }
                
                // Ensure quantity doesn't go below 0
                if ($medicine->current_quantity < 0) {
                    $medicine->current_quantity = 0;
                }
                
                $medicine->save();
            }

            $adjustment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete stock adjustment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getTransfers()
    {
        try {
            $transfers = Adjustment::with('medicine')
                ->whereIn('adjustment_type', ['transfer', 'donation'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $transfers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transfers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAdjustmentsByType($type)
    {
        try {
            $adjustments = Adjustment::with('medicine')
                ->where('adjustment_type', $type)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $adjustments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch adjustments',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 