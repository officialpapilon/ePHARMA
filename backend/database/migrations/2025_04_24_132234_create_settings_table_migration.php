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
        Schema::create('pharmacy_settings', function (Blueprint $table) {
            $table->id();
            $table->string('logo')->nullable();
            $table->string('stamp')->nullable();
            $table->string('pharmacy_name')->default('ePharma');
            $table->string('tin_number');
            $table->string('phone_number');
            $table->string('email');
            $table->json('departments')->nullable();
            $table->json('payment_options')->nullable();
            $table->string('default_dept')->default('Dispensing');
            $table->string('dispense_by_dept')->default('false');
            $table->string('mode')->default('simple');
            $table->string('show_expired')->nullable();
            $table->string('show_prices')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy_settings');
    }
};