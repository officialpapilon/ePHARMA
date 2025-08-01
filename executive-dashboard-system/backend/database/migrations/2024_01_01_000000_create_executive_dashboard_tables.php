<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Revenue tracking
        Schema::create('revenues', function (Blueprint $table) {
            $table->id();
            $table->decimal('amount', 15, 2);
            $table->string('source'); // pharmacy, wholesale, etc.
            $table->string('payment_method');
            $table->string('transaction_type');
            $table->date('transaction_date');
            $table->timestamps();
        });

        // Inventory tracking
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_value', 15, 2);
            $table->date('expiry_date')->nullable();
            $table->string('status'); // in_stock, low_stock, out_of_stock
            $table->timestamps();
        });

        // Branch management
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location');
            $table->string('status'); // active, inactive
            $table->integer('employee_count');
            $table->timestamps();
        });

        // Employee performance
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('position');
            $table->string('branch_id');
            $table->integer('transactions_count');
            $table->decimal('total_sales', 15, 2);
            $table->string('status'); // active, inactive
            $table->timestamps();
        });

        // Sales performance
        Schema::create('sales_performance', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->integer('units_sold');
            $table->decimal('revenue', 15, 2);
            $table->date('sale_date');
            $table->string('branch_id');
            $table->timestamps();
        });

        // Alerts and notifications
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // low_stock, high_demand, system_alert
            $table->string('title');
            $table->text('message');
            $table->string('severity'); // low, medium, high, critical
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenues');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('sales_performance');
        Schema::dropIfExists('alerts');
    }
}; 