<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wholesale_deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_number')->unique();
            $table->foreignId('order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('wholesale_customers')->onDelete('cascade');
            $table->foreignId('delivered_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', [
                'scheduled', 
                'in_transit', 
                'out_for_delivery',
                'delivered', 
                'failed', 
                'cancelled',
                'returned'
            ])->default('scheduled');
            $table->date('scheduled_date');
            $table->date('actual_delivery_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->time('actual_delivery_time')->nullable();
            $table->string('delivery_address');
            $table->string('contact_person');
            $table->string('contact_phone');
            $table->text('delivery_instructions')->nullable();
            $table->text('notes')->nullable();
            $table->string('vehicle_number')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_phone')->nullable();
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->boolean('is_partial_delivery')->default(false);
            $table->boolean('is_delivery_note_generated')->default(false);
            $table->boolean('is_delivery_receipt_generated')->default(false);
            $table->string('delivery_note_number')->nullable();
            $table->string('delivery_receipt_number')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_deliveries');
    }
};
