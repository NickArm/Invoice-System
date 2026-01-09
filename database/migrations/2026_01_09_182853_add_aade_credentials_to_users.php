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
            // AADE myDATA API credentials
            $table->string('aade_username')->nullable()->after('imap_subject_match_type');
            $table->string('aade_password')->nullable()->after('aade_username');
            $table->longText('aade_certificate')->nullable()->after('aade_password');
            $table->boolean('aade_enabled')->default(false)->after('aade_certificate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['aade_username', 'aade_password', 'aade_certificate', 'aade_enabled']);
        });
    }
};
