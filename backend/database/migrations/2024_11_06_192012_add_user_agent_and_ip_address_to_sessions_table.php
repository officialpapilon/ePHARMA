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
            if (!Schema::hasColumn('sessions', 'user_agent')) {
                $table->string('user_agent', 255)->nullable()->after('payload');
            }
            if (!Schema::hasColumn('sessions', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('user_agent');
            }
        });
    }
    
    public function down()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn(['user_agent', 'ip_address']);
        });
    }
    
    
};
