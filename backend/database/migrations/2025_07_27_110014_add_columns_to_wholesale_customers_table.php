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
        Schema::table('wholesale_customers', function (Blueprint $table) {
            $table->string('customer_code')->unique()->after('id');
            $table->string('business_name')->after('customer_code');
            $table->string('contact_person')->after('business_name');
            $table->string('phone_number')->after('contact_person');
            $table->string('email')->nullable()->after('phone_number');
            $table->text('address')->after('email');
            $table->string('city')->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('state');
            $table->string('country')->default('Tanzania')->after('postal_code');
            $table->string('tax_number')->nullable()->after('country');
            $table->string('business_license')->nullable()->after('tax_number');
            $table->enum('customer_type', ['pharmacy', 'hospital', 'clinic', 'distributor', 'other'])->after('business_license');
            $table->enum('credit_limit_type', ['unlimited', 'limited'])->default('limited')->after('customer_type');
            $table->decimal('credit_limit', 15, 2)->default(0)->after('credit_limit_type');
            $table->decimal('current_balance', 15, 2)->default(0)->after('credit_limit');
            $table->enum('payment_terms', ['immediate', '7_days', '15_days', '30_days', '60_days'])->default('immediate')->after('current_balance');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('payment_terms');
            $table->text('notes')->nullable()->after('status');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wholesale_customers', function (Blueprint $table) {
            $table->dropColumn([
                'customer_code',
                'business_name',
                'contact_person',
                'phone_number',
                'email',
                'address',
                'city',
                'state',
                'postal_code',
                'country',
                'tax_number',
                'business_license',
                'customer_type',
                'credit_limit_type',
                'credit_limit',
                'current_balance',
                'payment_terms',
                'status',
                'notes',
                'deleted_at'
            ]);
        });
    }
};
