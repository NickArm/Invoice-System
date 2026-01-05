<?php

namespace App\Jobs;

use App\Models\Attachment;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessEmailInvoiceAttachment implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $userId,
        public string $storagePath
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $user = User::find($this->userId);
            if (!$user) {
                \Log::error('User not found for email invoice processing', ['user_id' => $this->userId]);
                return;
            }

            // Get file from storage
            if (!Storage::disk('local')->exists($this->storagePath)) {
                \Log::error('Email attachment file not found', ['path' => $this->storagePath]);
                return;
            }

            $fileContents = Storage::disk('local')->get($this->storagePath);
            $extension = pathinfo($this->storagePath, PATHINFO_EXTENSION);

            // Determine mime type
            $mimeTypes = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'pdf' => 'application/pdf',
                'gif' => 'image/gif',
            ];

            $mimeType = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';

            // Create attachment record
            $attachment = Attachment::create([
                'user_id' => $user->id,
                'path' => $this->storagePath,
                'original_name' => basename($this->storagePath),
                'mime_type' => $mimeType,
                'size_bytes' => Storage::disk('local')->size($this->storagePath),
                'status' => 'pending',
                'is_draft' => true, // Flag as draft
            ]);

            // Process the attachment with AI extraction (marked as draft)
            ProcessInvoiceAttachment::dispatch($attachment, true);

        } catch (\Exception $e) {
            \Log::error('Error processing email invoice attachment', [
                'user_id' => $this->userId,
                'path' => $this->storagePath,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }
}
