<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('buyer_details', function (Blueprint $table) {
            $table->uuid('buyer_detail_id')->primary();
            $table->foreignId('user_id')->constrained('users');
            $table->string('organization_name');
            $table->string('tax_identification_number')->nullable();
            $table->text('billing_address');
            $table->text('shipping_address')->nullable();
            $table->string('city');
            $table->string('state');
            $table->string('country');
            $table->string('postal_code');
            $table->string('contact_person_name');
            $table->string('contact_person_phone');
            $table->string('contact_person_email');
            $table->enum('payment_terms', ['prepaid', 'net_7', 'net_15', 'net_30'])->default('prepaid');
            $table->decimal('credit_limit', 12, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('buyer_details');
    }
};