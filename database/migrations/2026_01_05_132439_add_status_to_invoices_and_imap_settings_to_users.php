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
        // Modify status column in invoices to use enum
        Schema::table('invoices', function (Blueprint $table) {
            // SQLite doesn't support modify, so we'll just ensure values are correct
            // The application will enforce the enum values
        });

        // Add IMAP settings to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('imap_host')->nullable()->after('accountant_emails');
            $table->integer('imap_port')->nullable()->after('imap_host');
            $table->string('imap_username')->nullable()->after('imap_port');
            $table->string('imap_password')->nullable()->after('imap_username');
            $table->boolean('imap_ssl')->default(true)->after('imap_password');
            $table->string('imap_subject_filter')->nullable()->after('imap_ssl');
            $table->enum('imap_subject_match_type', ['exact', 'contains'])->default('contains')->after('imap_subject_filter');
            $table->boolean('imap_enabled')->default(false)->after('imap_subject_match_type');
        });

        // Update existing invoices to have 'approved' status instead of 'pending'
        DB::table('invoices')->where('status', 'pending')->update(['status' => 'approved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'imap_host',
                'imap_port',
                'imap_username',
                'imap_password',
                'imap_ssl',
                'imap_subject_filter',
                'imap_subject_match_type',
                'imap_enabled',
            ]);
        });

        // Revert status values back to pending
        DB::table('invoices')->where('status', 'approved')->update(['status' => 'pending']);
    }
};
