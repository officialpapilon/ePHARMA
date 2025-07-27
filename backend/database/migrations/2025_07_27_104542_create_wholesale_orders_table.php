<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wholesale_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('wholesale_customers')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->enum('order_type', ['sale', 'quotation', 'reservation'])->default('sale');
            $table->enum('status', [
                'draft', 
                'confirmed', 
                'processing', 
                'ready_for_delivery', 
                'out_for_delivery',
                'delivered', 
                'cancelled', 
                'completed'
            ])->default('draft');
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'overdue', 'pay_later'])->default('pending');
            $table->enum('payment_terms', ['pay_now', 'pay_later', 'partial_payment'])->default('pay_now');
            $table->enum('delivery_type', ['delivery', 'pickup'])->default('delivery');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->string('invoice_number')->nullable();
            $table->boolean('is_invoiced')->default(false);
            $table->boolean('is_delivered')->default(false);
            $table->boolean('is_payment_processed')->default(false);
            $table->boolean('is_delivery_scheduled')->default(false);
            $table->string('delivery_address')->nullable();
            $table->string('delivery_contact_person')->nullable();
            $table->string('delivery_contact_phone')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_orders');
    }
};
