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
        Schema::table('financial_activities', function (Blueprint $table) {
            $table->string('category', 255)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_activities', function (Blueprint $table) {
            $table->enum('category', [
                'sales_revenue', 'service_fees', 'consultation_fees', 'other_income',
                'operational_expenses', 'rent_utilities', 'salaries_wages', 'inventory_purchase',
                'marketing_advertising', 'maintenance_repairs', 'insurance', 'taxes',
                'office_supplies', 'transportation', 'professional_fees', 'other_expenses'
            ])->change();
        });
    }
};
