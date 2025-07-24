<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('medicines_caches', function (Blueprint $table) {
            $table->string('batch_no')->after('product_id'); // Add the batch_no column
        });
    }
    
    public function down()
    {
        Schema::table('medicines_caches', function (Blueprint $table) {
            $table->dropColumn('batch_no');
        });
    }
    
};
