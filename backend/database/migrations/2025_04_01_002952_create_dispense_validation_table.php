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
        Schema::create('dispense_validation', function (Blueprint $table) {
            $table->id();
            
            $table->string('product_id');
            $table->string('Payment_ID');
            $table->string('Patient_ID');
            $table->integer('quantity');

            //Validation only single payment         
            $table->unique(['product_id', 'Payment_ID']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispense_validation');
    }
};
