<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_approval', function (Blueprint $table) {
            $table->integer('Payment_ID')->autoIncrement()->primary(); 
            $table->string('Patient_ID');
            $table->string('transaction_ID');
            $table ->string('Product_ID');
            $table->string('status');
            $table->string('approved_by');
            $table->string('approved_at');
            $table->string('approved_quantity');
            $table->string('approved_amount');
            $table->string('approved_payment_method');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_approval');
    }
};