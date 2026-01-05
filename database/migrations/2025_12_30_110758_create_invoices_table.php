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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_entity_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type')->default('expense');
            $table->string('status')->default('pending');
            $table->string('number')->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->string('currency')->default('EUR');
            $table->decimal('total_gross', 10, 2);
            $table->decimal('total_net', 10, 2);
            $table->decimal('vat_percent', 5, 2)->default(24);
            $table->decimal('vat_amount', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('status');
            $table->index('issue_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
