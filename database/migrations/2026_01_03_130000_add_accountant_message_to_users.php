<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('accountant_emails_string')->nullable()->after('accountant_emails');
            $table->text('accountant_message')->nullable()->after('accountant_emails_string');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['accountant_emails_string', 'accountant_message']);
        });
    }
};
