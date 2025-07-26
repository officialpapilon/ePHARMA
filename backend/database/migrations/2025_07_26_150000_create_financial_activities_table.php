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
        Schema::create('financial_activities', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique(); // FA-2025-001 format
            $table->enum('type', ['income', 'expense', 'refund', 'adjustment']);
            $table->string('category', 255);
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'mobile_money', 'card', 'other']);
            $table->string('reference_number')->nullable(); // Receipt/Invoice number
            $table->date('transaction_date');
            $table->text('notes')->nullable();
            $table->string('attachment_path')->nullable(); // For receipts/invoices
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->unsignedBigInteger('created_by'); // User who created the transaction
            $table->unsignedBigInteger('approved_by')->nullable(); // User who approved
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['type', 'category']);
            $table->index('transaction_date');
            $table->index('status');
            $table->index('created_by');
            
            // Foreign keys
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_activities');
    }
}; 