<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable(); // No position specified
        });
    }
    
    public function down()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('ip_address');
        });
    }
    

};
