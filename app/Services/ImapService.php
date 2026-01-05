<?php

namespace App\Services;

use App\Jobs\ProcessEmailInvoiceAttachment;
use App\Models\User;
use Webklex\PHPIMAP\ClientManager;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImapService
{
    /**
     * Fetch and process emails for a given user
     */
    public function fetchEmailsForUser(User $user): array
    {
        if (!$user->imap_enabled || !$user->imap_host) {
            return [
                'success' => false,
                'message' => 'IMAP not configured for user'
            ];
        }

        try {
            // Create IMAP client
            $client = $this->createClient($user);
            $client->connect();

            // Get inbox
            $folder = $client->getFolder('INBOX');

            // Get unread messages
            $messages = $folder->query()->unseen()->get();

            $processed = 0;
            $errors = [];

            foreach ($messages as $message) {
                try {
                    if ($this->shouldProcessMessage($message, $user)) {
                        $result = $this->processMessage($message, $user);
                        if ($result['processed']) {
                            $processed++;
                        }
                    }
                } catch (\Exception $e) {
                    $errors[] = "Error processing message {$message->getMessageId()}: {$e->getMessage()}";
                    Log::error('IMAP message processing error', [
                        'user_id' => $user->id,
                        'message_id' => $message->getMessageId(),
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $client->disconnect();

            return [
                'success' => true,
                'processed' => $processed,
                'total_messages' => count($messages),
                'errors' => $errors
            ];

        } catch (\Exception $e) {
            Log::error('IMAP connection error', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'IMAP connection failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create IMAP client for user
     */
    protected function createClient(User $user)
    {
        $cm = new ClientManager();

        return $cm->make([
            'host' => $user->imap_host,
            'port' => $user->imap_port ?? 993,
            'encryption' => $user->imap_ssl ? 'ssl' : false,
            'validate_cert' => true,
            'username' => $user->imap_username,
            'password' => $user->imap_password,
            'protocol' => 'imap'
        ]);
    }

    /**
     * Check if message should be processed based on subject filter
     */
    protected function shouldProcessMessage($message, User $user): bool
    {
        if (!$user->imap_subject_filter) {
            return true; // Process all if no filter set
        }

        $subject = $message->getSubject();
        $filter = $user->imap_subject_filter;

        if ($user->imap_subject_match_type === 'exact') {
            return strtolower(trim($subject)) === strtolower(trim($filter));
        }

        // Contains
        return stripos($subject, $filter) !== false;
    }

    /**
     * Process message and extract invoice attachments
     */
    protected function processMessage($message, User $user): array
    {
        $processed = false;

        try {
            $attachments = $message->getAttachments();

            if (empty($attachments)) {
                Log::info('Email has no attachments', [
                    'user_id' => $user->id,
                    'subject' => $message->getSubject()
                ]);
                return ['processed' => false];
            }

            foreach ($attachments as $attachment) {
                try {
                    // Debug: Log all available methods on the attachment object
                    $methods = get_class_methods($attachment);
                    Log::debug('Attachment object class and methods', [
                        'class' => get_class($attachment),
                        'methods' => $methods
                    ]);

                    // Get extension
                    $filename = $attachment->getFileName() ?? $attachment->getName() ?? 'document';
                    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

                    // Check if it's an image or PDF
                    if (in_array($extension, ['jpg', 'jpeg', 'png', 'pdf', 'gif'])) {
                        try {
                            // Get attachment content - try different methods
                            $content = null;

                            // Try using the fetch() method from webklex
                            try {
                                if (method_exists($attachment, 'fetch')) {
                                    $fetched = $attachment->fetch();
                                    $content = $fetched;
                                    Log::debug('Got attachment content via fetch()', ['filename' => $filename]);
                                }
                            } catch (\Exception $e) {
                                Log::debug('fetch() failed', ['filename' => $filename, 'error' => $e->getMessage()]);
                            }

                            // Try accessing the 'part' property and getting body
                            if (!$content && isset($attachment->part)) {
                                try {
                                    $part = $attachment->part;
                                    if (method_exists($part, 'getBody')) {
                                        $content = $part->getBody();
                                        Log::debug('Got attachment content via part->getBody()', ['filename' => $filename]);
                                    } elseif (property_exists($part, 'body')) {
                                        $content = $part->body;
                                        Log::debug('Got attachment content via part->body property', ['filename' => $filename]);
                                    }
                                } catch (\Exception $e) {
                                    Log::debug('part property access failed', ['filename' => $filename, 'error' => $e->getMessage()]);
                                }
                            }

                            // Try __get magic method to access common properties
                            if (!$content) {
                                try {
                                    $content = $attachment->body ?? $attachment->content ?? null;
                                    if ($content) {
                                        Log::debug('Got attachment content via magic __get', ['filename' => $filename]);
                                    }
                                } catch (\Exception $e) {
                                    Log::debug('magic __get failed', ['filename' => $filename, 'error' => $e->getMessage()]);
                                }
                            }

                            if (!$content) {
                                Log::warning('Could not read attachment content - all methods failed', [
                                    'filename' => $filename,
                                    'user_id' => $user->id,
                                    'attachment_class' => get_class($attachment),
                                    'attachment_methods' => array_filter(get_class_methods($attachment), function($m) {
                                        return !str_starts_with($m, '__');
                                    })
                                ]);
                                continue;
                            }

                            // Save attachment to storage (use local disk, not private)
                            $sanitized = $this->sanitizeFilename($filename);
                            $path = "invoices/draft/{$user->id}/" . uniqid() . "_{$sanitized}";

                            Storage::disk('local')->put($path, $content);

                            // Dispatch job to process the invoice
                            ProcessEmailInvoiceAttachment::dispatch($user->id, $path);

                            $processed = true;

                            Log::info('Email attachment queued for processing', [
                                'user_id' => $user->id,
                                'filename' => $filename,
                                'extension' => $extension,
                                'size' => is_string($content) ? strlen($content) : 0,
                                'subject' => $message->getSubject()
                            ]);

                        } catch (\Exception $e) {
                            Log::error('Error saving email attachment', [
                                'user_id' => $user->id,
                                'filename' => $filename,
                                'error' => $e->getMessage(),
                                'trace' => $e->getTraceAsString()
                            ]);
                        }
                    } else {
                        Log::debug('Skipping non-invoice attachment', [
                            'filename' => $filename,
                            'extension' => $extension
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error processing individual attachment', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Mark message as read after processing
            if ($processed) {
                try {
                    $message->setFlag('Seen');
                } catch (\Exception $e) {
                    Log::warning('Could not mark message as seen', ['error' => $e->getMessage()]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error getting attachments from message', [
                'user_id' => $user->id,
                'subject' => $message->getSubject() ?? 'unknown',
                'error' => $e->getMessage()
            ]);
        }

        return ['processed' => $processed];
    }

    /**
     * Sanitize filename for storage
     */
    protected function sanitizeFilename(string $filename): string
    {
        // Remove any path components
        $filename = basename($filename);

        // Replace special characters
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);

        return $filename;
    }

    /**
     * Test IMAP connection for user
     */
    public function testConnection(User $user): array
    {
        try {
            $client = $this->createClient($user);
            $client->connect();
            $client->disconnect();

            return [
                'success' => true,
                'message' => 'Connection successful'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
