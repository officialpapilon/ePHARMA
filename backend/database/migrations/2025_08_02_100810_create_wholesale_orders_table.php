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
        Schema::create('wholesale_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('wholesale_customers');
            $table->foreignId('created_by')->constrained('users');
            $table->enum('order_type', ['sale', 'purchase', 'return'])->default('sale');
            $table->enum('status', [
                'pending_payment',
                'confirmed',
                'processing',
                'ready_for_delivery',
                'delivered',
                'cancelled'
            ])->default('pending_payment');
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
            $table->enum('payment_terms', ['pay_now', 'pay_later', 'partial_payment'])->default('pay_now');
            $table->enum('payment_method', ['cash', 'mobile_money', 'card'])->default('cash');
            $table->enum('delivery_type', ['delivery', 'pickup'])->default('delivery');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->date('order_date');
            $table->date('expected_delivery_date');
            $table->date('due_date');
            $table->text('notes')->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->text('delivery_address')->nullable();
            $table->string('delivery_contact_person')->nullable();
            $table->string('delivery_contact_phone')->nullable();
            $table->boolean('inventory_reserved')->default(false);
            $table->boolean('inventory_deducted')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wholesale_orders');
    }
};
