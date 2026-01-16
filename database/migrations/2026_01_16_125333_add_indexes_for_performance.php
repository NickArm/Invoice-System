<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Optimize invoices table queries
        Schema::table('invoices', function (Blueprint $table) {
            // Composite index for filtering in dashboard
            $table->index(['user_id', 'status', 'issue_date'], 'idx_invoices_user_status_date');
            // For type filtering
            $table->index(['user_id', 'type'], 'idx_invoices_user_type');
        });

        // Optimize business_entities table queries
        // Note: user_id index and unique constraint likely exist already

        // Optimize attachments table queries
        Schema::table('attachments', function (Blueprint $table) {
            // For user + status filtering
            $table->index(['user_id', 'status'], 'idx_attachments_user_status');
        });

        // Optimize categories table queries (if not already indexed)
        Schema::table('categories', function (Blueprint $table) {
            if (!$this->hasIndex('categories', 'user_id')) {
                $table->index('user_id', 'idx_categories_user');
            }
        });

        // Optimize sessions table for cleanup
        Schema::table('sessions', function (Blueprint $table) {
            $table->index('last_activity', 'idx_sessions_last_activity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_user_status_date');
            $table->dropIndex('idx_invoices_user_type');
        });

        Schema::table('attachments', function (Blueprint $table) {
            $table->dropIndex('idx_attachments_user_status');
        });

        Schema::table('categories', function (Blueprint $table) {
            if ($this->hasIndex('categories', 'user_id')) {
                $table->dropIndex('idx_categories_user');
            }
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex('idx_sessions_last_activity');
        });
    }

    /**
     * Check if an index exists on a table
     */
    private function hasIndex(string $table, string $column): bool
    {
        $indexes = DB::select("PRAGMA index_list({$table})");
        foreach ($indexes as $index) {
            if (strpos($index->name, $column) !== false) {
                return true;
            }
        }
        return false;
    }
};
