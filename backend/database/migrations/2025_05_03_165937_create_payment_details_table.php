<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  
    public function up(): void
    {
        Schema::create('payment_details', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id');
            $table->string('payment_status');
            $table->string('payment_method');
            $table->decimal('payed_amount', 8, 2);
            $table->string('transaction_id');
            $table->string('created_by');
            $table->string('updated_by')->nullable();
            $table->index(['transaction_id', 'payment_status']);       
            $table->timestamps();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('payment_details');
    }
};
