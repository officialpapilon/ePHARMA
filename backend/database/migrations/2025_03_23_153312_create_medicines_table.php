<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMedicinesTable extends Migration
{
    public function up()
    {
        
    Schema::create('medicines', function (Blueprint $table) {
        $table->id();
        $table->string('product_name');
        $table->string('product_category');
        $table->string('product_unit');
        $table->string('product_price');
        $table->unsignedBigInteger('created_by');
        $table->unsignedBigInteger('updated_by')->nullable();
        $table->timestamps();
        $table->foreign('created_by')->references('id')->on('users');
        $table->foreign('updated_by')->references('id')->on('users');

    });

    }
    public function down()
    {
        Schema::dropIfExists('medicines');
    }
}
