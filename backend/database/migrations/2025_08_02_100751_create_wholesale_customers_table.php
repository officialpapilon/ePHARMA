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
        Schema::create('wholesale_customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code')->unique();
            $table->string('business_name');
            $table->string('contact_person');
            $table->string('phone_number');
            $table->string('email')->nullable();
            $table->text('address');
            $table->string('city');
            $table->string('state');
            $table->string('postal_code')->nullable();
            $table->string('country');
            $table->string('tax_number')->nullable();
            $table->string('business_license')->nullable();
            $table->enum('customer_type', ['pharmacy', 'hospital', 'clinic', 'distributor', 'other']);
            $table->enum('credit_limit_type', ['unlimited', 'limited']);
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->enum('payment_terms', ['immediate', 'net_30', 'net_60', 'net_90']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wholesale_customers');
    }
};
