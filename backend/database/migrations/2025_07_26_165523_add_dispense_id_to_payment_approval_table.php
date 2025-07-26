<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_approval', function (Blueprint $table) {
            $table->string('dispense_id')->unique()->nullable()->after('Payment_ID');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_approval', function (Blueprint $table) {
            $table->dropColumn('dispense_id');
        });
    }
};
