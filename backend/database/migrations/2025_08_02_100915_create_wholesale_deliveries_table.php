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
        Schema::create('wholesale_deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_number')->unique();
            $table->foreignId('order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('wholesale_customers');
            $table->foreignId('assigned_to')->constrained('users');
            $table->enum('status', ['scheduled', 'in_transit', 'delivered', 'failed'])->default('scheduled');
            $table->date('delivery_date');
            $table->text('delivery_address')->nullable();
            $table->string('delivery_contact_person')->nullable();
            $table->string('delivery_contact_phone')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wholesale_deliveries');
    }
};
