<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Fetch emails with invoice attachments every 5 minutes
        $schedule->command('invoices:fetch-emails')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Email invoice fetch completed successfully');
            })
            ->onFailure(function () {
                \Log::error('Email invoice fetch failed');
            });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
