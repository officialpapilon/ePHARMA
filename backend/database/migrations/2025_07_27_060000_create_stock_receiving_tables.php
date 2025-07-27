<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('stock_receivings', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_name');
            $table->string('invoice_number');
            $table->date('delivery_date');
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'received', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
        });

        Schema::create('stock_receiving_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('receiving_id');
            $table->string('product_id');
            $table->string('product_name');
            $table->string('batch_no');
            $table->integer('quantity_received');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('buying_price', 10, 2);
            $table->date('manufacture_date');
            $table->date('expire_date');
            $table->timestamps();

            $table->foreign('receiving_id')->references('id')->on('stock_receivings')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_receiving_items');
        Schema::dropIfExists('stock_receivings');
    }
}; 