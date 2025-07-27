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
        Schema::table('medicines_caches', function (Blueprint $table) {
            $table->decimal('buying_price', 10, 2)->nullable()->after('product_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicines_caches', function (Blueprint $table) {
            $table->dropColumn('buying_price');
        });
    }
};
