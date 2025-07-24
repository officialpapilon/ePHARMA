<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdjustmentsTable extends Migration
{
    public function up()
    {
        Schema::create('adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('product_id');
            $table->string('batch_no');
            $table->date('adjustment_date');
            $table->string('adjustment_type');  
            $table->integer('quantity_adjusted');
            $table->string('created_by');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('adjustments');
    }
}
