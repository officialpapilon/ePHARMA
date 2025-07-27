<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wholesale_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->string('product_id');
            $table->string('batch_no');
            $table->string('product_name');
            $table->string('product_category');
            $table->integer('quantity_ordered');
            $table->integer('quantity_delivered')->default(0);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('wholesale_price', 10, 2);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('total', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_order_items');
    }
};
