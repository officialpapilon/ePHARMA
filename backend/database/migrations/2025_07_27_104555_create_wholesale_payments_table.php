<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wholesale_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->foreignId('order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('wholesale_customers')->onDelete('cascade');
            $table->foreignId('received_by')->constrained('users')->onDelete('cascade');
            $table->enum('payment_type', ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'credit_card', 'other']);
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled', 'refunded'])->default('pending');
            $table->enum('payment_category', ['full_payment', 'partial_payment', 'debt_mark', 'debt_payment'])->default('full_payment');
            $table->decimal('amount', 15, 2);
            $table->decimal('amount_received', 15, 2)->default(0);
            $table->string('reference_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('cheque_number')->nullable();
            $table->date('payment_date');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('receipt_number')->nullable();
            $table->boolean('is_receipt_generated')->default(false);
            $table->boolean('is_invoice_generated')->default(false);
            $table->string('invoice_number')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_payments');
    }
};
