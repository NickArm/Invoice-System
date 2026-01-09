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
        Schema::table('users', function (Blueprint $table) {
            // VAT Registry credentials (for tax ID validation)
            $table->string('vat_registry_username')->nullable()->after('aade_enabled');
            $table->string('vat_registry_password')->nullable()->after('vat_registry_username');
            
            // Rename AADE fields to be more specific (myDATA API)
            // Keep existing aade_* fields but add mydata_subscription_key
            $table->string('mydata_subscription_key')->nullable()->after('vat_registry_password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'vat_registry_username',
                'vat_registry_password',
                'mydata_subscription_key',
            ]);
        });
    }
};
