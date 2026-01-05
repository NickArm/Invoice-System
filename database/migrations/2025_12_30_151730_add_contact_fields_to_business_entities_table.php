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
        Schema::table('business_entities', function (Blueprint $table) {
            $table->string('address')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('address');
            $table->string('phone')->nullable()->after('postal_code');
            $table->string('mobile')->nullable()->after('phone');
            $table->string('tax_office')->nullable()->after('tax_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_entities', function (Blueprint $table) {
            $table->dropColumn(['address', 'postal_code', 'phone', 'mobile', 'tax_office']);
        });
    }
};
