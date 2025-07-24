<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_category');
            $table->string('adjustment_reason');
            $table->unsignedBigInteger('adjustment_product');
            $table->integer('adjusted_quantity');
            $table->unsignedBigInteger('created_by');
            $table->string('updated_by')->nullable();
            $table->string('deleted_by')->nullable();
            $table->foreign('adjustment_product')->references('id')->on('items');
            $table->index(['adjustment_product', 'adjustment_category']);
            $table->index(['adjustment_product', 'adjustment_reason']);
            $table->index(['adjustment_product', 'created_by']);
            $table->index(['adjustment_product', 'updated_by']);
            $table->index(['adjustment_product', 'deleted_by']);
            $table->timestamps();
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
