<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ImapService;
use Illuminate\Console\Command;

class FetchEmailInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:fetch-emails {--user= : Process only specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch invoices from user email inboxes via IMAP';

    /**
     * Execute the console command.
     */
    public function handle(ImapService $imapService)
    {
        $this->info('Starting email invoice fetch...');

        $query = User::where('imap_enabled', true)
            ->whereNotNull('imap_host');

        if ($userId = $this->option('user')) {
            $query->where('id', $userId);
        }

        $users = $query->get();

        if ($users->isEmpty()) {
            $this->warn('No users with IMAP configured found.');
            return 0;
        }

        $this->info("Processing {$users->count()} user(s)...");

        foreach ($users as $user) {
            $this->line("Processing user: {$user->name} ({$user->email})");

            $result = $imapService->fetchEmailsForUser($user);

            if ($result['success']) {
                $this->info("  ✓ Processed {$result['processed']} invoice(s) from {$result['total_messages']} message(s)");

                if (!empty($result['errors'])) {
                    foreach ($result['errors'] as $error) {
                        $this->error("  ✗ {$error}");
                    }
                }
            } else {
                $this->error("  ✗ {$result['message']}");
            }
        }

        $this->info('Email fetch completed.');
        return 0;
    }
}

