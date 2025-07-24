<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameIdToProductIdInMedicinesTable extends Migration
{
    public function up()
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->renameColumn('id', 'product_id');
        });
    }

    public function down()
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->renameColumn('product_id', 'id');
        });
    }
}
