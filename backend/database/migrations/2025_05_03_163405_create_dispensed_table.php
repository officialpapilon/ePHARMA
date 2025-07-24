<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('dispensed', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id');
            $table->string('transaction_status');
            $table->string('customer_id');
            $table->json('product_purchased');
            $table->json('product_quantity');
            $table->decimal('total_price', 8, 2);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('dispensed');
    }
};
