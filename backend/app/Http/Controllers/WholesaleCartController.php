<?php

namespace App\Http\Controllers;

use App\Models\WholesaleCart;
use App\Models\WholesaleCartItem;
use App\Models\WholesaleCustomer;
use App\Models\MedicinesCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WholesaleCartController extends Controller
{
    /**
     * Create a simple cart from POS
     */
    public function createFromPos(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'required|exists:wholesale_customers,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|string',
                'items.*.batch_no' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            // Calculate basic totals
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            // Create cart
            $cart = WholesaleCart::create([
                'cart_number' => 'CART-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'customer_id' => $validated['customer_id'],
                'created_by' => Auth::id() ?? 1,
                'status' => 'active',
                'subtotal' => $subtotal,
                'tax_amount' => 0, // Will be calculated in order preparation
                'discount_amount' => 0, // Will be calculated in order preparation
                'total_amount' => $subtotal,
                'notes' => 'Cart created from POS',
            ]);

            // Create cart items
            foreach ($validated['items'] as $item) {
                // Fetch product details
                $product = MedicinesCache::where('product_id', $item['product_id'])
                    ->where('batch_no', $item['batch_no'])
                    ->first();

                if (!$product) {
                    throw new \Exception("Product not found: {$item['product_id']}");
                }

                WholesaleCartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $item['product_id'],
                    'batch_no' => $item['batch_no'],
                    'product_name' => $product->product_name,
                    'product_category' => $product->product_category,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cart created successfully',
                'data' => [
                    'cart' => $cart->load(['customer', 'items']),
                    'next_step' => 'order_preparation',
                    'workflow_status' => 'cart_created'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Cart creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create cart: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cart details
     */
    public function show($id)
    {
        try {
            $cart = WholesaleCart::with(['customer', 'items'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $cart,
                'message' => 'Cart retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cart not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update cart
     */
    public function update(Request $request, $id)
    {
        try {
            $cart = WholesaleCart::findOrFail($id);
            
            $validated = $request->validate([
                'items' => 'sometimes|array',
                'notes' => 'sometimes|string',
            ]);

            if (isset($validated['items'])) {
                // Update cart items
                foreach ($validated['items'] as $item) {
                    if (isset($item['id'])) {
                        $cartItem = WholesaleCartItem::find($item['id']);
                        if ($cartItem && $cartItem->cart_id === $cart->id) {
                            $cartItem->update([
                                'quantity' => $item['quantity'],
                                'unit_price' => $item['unit_price'],
                                'total' => $item['quantity'] * $item['unit_price'],
                            ]);
                        }
                    }
                }

                // Recalculate totals
                $subtotal = $cart->items->sum('total');
                $cart->update([
                    'subtotal' => $subtotal,
                    'total_amount' => $subtotal,
                ]);
            }

            if (isset($validated['notes'])) {
                $cart->update(['notes' => $validated['notes']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Cart updated successfully',
                'data' => $cart->load(['customer', 'items'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update cart',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete cart
     */
    public function destroy($id)
    {
        try {
            $cart = WholesaleCart::findOrFail($id);
            $cart->delete();

            return response()->json([
                'success' => true,
                'message' => 'Cart deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete cart',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 