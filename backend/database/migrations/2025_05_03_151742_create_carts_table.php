<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->integer('transaction_ID')->autoIncrement()->primary(); 
            $table->string('patient_ID');
            $table->json('product_purchased');
            $table->decimal('total_price', 8, 2);
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
