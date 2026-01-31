<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\BusinessEntity;
use App\Models\Invoice;

echo "Searching for business entity with tax_id 047236845...\n";
$be = BusinessEntity::where('tax_id', '047236845')->first();

if ($be) {
    echo "✓ Found BE: {$be->name} (ID: {$be->id})\n";

    echo "\nSearching for invoices on 2026-01-26 with amount 100.00...\n";
    $invoices = Invoice::where('business_entity_id', $be->id)
        ->where('issue_date', '2026-01-26')
        ->whereBetween('total_gross', [99.99, 100.01])
        ->get();

    echo "Found {$invoices->count()} invoices\n";
    foreach ($invoices as $inv) {
        echo "  - Invoice ID: {$inv->id}, Total Gross: {$inv->total_gross}, Status: {$inv->status}\n";
    }

    if ($invoices->count() === 0) {
        echo "\nTrying without amount filter...\n";
        $allInvoices = Invoice::where('business_entity_id', $be->id)
            ->where('issue_date', '2026-01-26')
            ->get();
        echo "Found {$allInvoices->count()} invoices on that date:\n";
        foreach ($allInvoices as $inv) {
            echo "  - Invoice ID: {$inv->id}, Total Gross: {$inv->total_gross}\n";
        }
    }
} else {
    echo "✗ No BE found with tax_id 047236845\n";
    echo "\nAvailable tax IDs:\n";
    BusinessEntity::limit(10)->get()->each(function ($be) {
        echo "  - {$be->tax_id}: {$be->name}\n";
    });
}
