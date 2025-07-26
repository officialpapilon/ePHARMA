<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Added this import for DB facade

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_approval', function (Blueprint $table) {
            // First, update any existing null dispense_ids with a default value
            DB::statement("UPDATE payment_approval SET dispense_id = CONCAT('DISP-', YEAR(NOW()), '-', LPAD(FLOOR(RAND() * 9999), 4, '0')) WHERE dispense_id IS NULL");
            
            // Then make the column not null
            $table->string('dispense_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_approval', function (Blueprint $table) {
            $table->string('dispense_id')->nullable()->change();
        });
    }
};
