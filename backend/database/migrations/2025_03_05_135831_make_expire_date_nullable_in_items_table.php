<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class MakeExpireDateNullableInItemsTable extends Migration
{
    public function up()
    {
        Schema::table('medicines_caches', function (Blueprint $table) {
            $table->date('expire_date')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('medicines_caches', function (Blueprint $table) {
            $table->date('expire_date')->nullable(false)->change();
        });
    }
}