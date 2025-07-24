<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('stock_takings', function (Blueprint $table) {
            $table->id();
            $table->json('products'); 
            $table->string('created_by');
            $table->timestamps(); 
         
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_takings');
    }
};
