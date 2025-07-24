<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  
    public function up(): void
    {
        Schema::create('patient_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_id');
            $table->date('transaction_date');
            $table->unsignedBigInteger('product_purchased');
            $table->string('payment_status');
            $table->timestamps();
        });
    }

  
    public function down(): void
    {
        Schema::dropIfExists('patients_records');
    }
};
