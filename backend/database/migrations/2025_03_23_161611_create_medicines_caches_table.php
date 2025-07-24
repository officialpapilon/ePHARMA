<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMedicinesCachesTable extends Migration
{
    public function up()
    {
        Schema::create('medicines_caches', function (Blueprint $table) {
            $table->id();
            $table->string('product_id'); // Assuming this references medicines table
            $table->string('product_name', 255);
            $table->decimal('product_price', 10, 2);
            $table->string('product_category', 255);
            $table->date('expire_date');
            $table->integer('current_quantity')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('medicines_caches');
    }
}