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
        // Invoices - composite indexes for common queries
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_user_status');
            $table->index(['user_id', 'type', 'issue_date'], 'idx_user_type_date');
        });

        // Business Entities - for lookups and duplicate checks
        Schema::table('business_entities', function (Blueprint $table) {
            $table->index(['user_id', 'name'], 'idx_user_name');
            $table->index(['user_id', 'tax_id'], 'idx_user_tax_id');
        });

        // Attachments - for status queries
        Schema::table('attachments', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_att_user_status');
        });

        // Categories - for user lookups
        Schema::table('categories', function (Blueprint $table) {
            $table->index(['user_id', 'name'], 'idx_cat_user_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_user_status');
            $table->dropIndex('idx_user_type_date');
        });

        Schema::table('business_entities', function (Blueprint $table) {
            $table->dropIndex('idx_user_name');
            $table->dropIndex('idx_user_tax_id');
        });

        Schema::table('attachments', function (Blueprint $table) {
            $table->dropIndex('idx_att_user_status');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('idx_cat_user_name');
        });
    }
};
