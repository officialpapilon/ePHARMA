<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_id');
            $table->unsignedBigInteger('customer_id');
            $table->string('payment_method');
            $table->text('transaction_items');
            $table->decimal('total_amount', 8, 2);
            $table->decimal('payed_amount', 8, 2);
            $table->decimal('change_amount', 8, 2);
            $table->foreign('transaction_id')->references('id')->on('dispensed');
            $table->string('created_by');
            $table->string('updated_by')->nullable();
            $table->index(['transaction_id', 'customer_id']);
            $table->string('deleted_by')->nullable();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email');
            $table->string('customer_address');
            $table->timestamps();
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
