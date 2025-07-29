<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wholesale_orders', function (Blueprint $table) {
            // Add payment method tracking
            $table->enum('payment_method', ['cash', 'mobile_money', 'card'])->default('cash')->after('payment_terms');
            
            // Add delivery person tracking
            $table->unsignedBigInteger('assigned_delivery_person_id')->nullable()->after('created_by');
            $table->foreign('assigned_delivery_person_id')->references('id')->on('users')->onDelete('set null');
            
            // Add inventory tracking
            $table->boolean('inventory_reserved')->default(false)->after('is_delivery_scheduled');
            $table->boolean('inventory_deducted')->default(false)->after('inventory_reserved');
            
            // Add delivery note tracking
            $table->string('delivery_note_number')->nullable()->after('invoice_number');
            $table->boolean('is_delivery_note_generated')->default(false)->after('is_delivery_scheduled');
            
            // Update status enum
            $table->enum('status', [
                'draft', 
                'pending_payment', 
                'payment_processing',
                'paid',
                'confirmed', 
                'processing', 
                'ready_for_delivery', 
                'assigned_to_delivery',
                'out_for_delivery',
                'picked_by_customer',
                'delivered', 
                'cancelled', 
                'completed'
            ])->default('draft')->change();
        });
    }

    public function down(): void
    {
        Schema::table('wholesale_orders', function (Blueprint $table) {
            $table->dropForeign(['assigned_delivery_person_id']);
            $table->dropColumn([
                'payment_method',
                'assigned_delivery_person_id',
                'inventory_reserved',
                'inventory_deducted',
                'delivery_note_number',
                'is_delivery_note_generated'
            ]);
            
            $table->enum('status', [
                'draft', 
                'confirmed', 
                'processing', 
                'ready_for_delivery', 
                'out_for_delivery',
                'delivered', 
                'cancelled', 
                'completed'
            ])->default('draft')->change();
        });
    }
}; 