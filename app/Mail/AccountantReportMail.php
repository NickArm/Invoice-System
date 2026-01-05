<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class AccountantReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public array $summary,
        public $invoices,
        public Carbon $dateFrom,
        public Carbon $dateTo,
        public string $type,
        public ?string $zipPath = null,
        public ?string $zipName = null,
        public int $attachmentsCount = 0,
        public string $userMessage = '',
    ) {
    }

    public function build(): self
    {
        $subject = 'Invoice export ' . $this->dateFrom->format('d/m/Y') . ' - ' . $this->dateTo->format('d/m/Y');

        $mail = $this->subject($subject)
            ->view('emails.accountant_report')
            ->with([
                'user' => $this->user,
                'summary' => $this->summary,
                'invoices' => $this->invoices,
                'dateFrom' => $this->dateFrom,
                'dateTo' => $this->dateTo,
                'type' => $this->type,
                'attachmentsCount' => $this->attachmentsCount,
                'userMessage' => $this->userMessage,
            ]);

        if ($this->zipPath) {
            $mail->attach(Storage::disk('local')->path($this->zipPath), [
                'as' => $this->zipName ?? basename($this->zipPath),
            ]);
        }

        return $mail;
    }
}
