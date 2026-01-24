<?php

namespace App\Jobs;

use App\Models\Attachment;
use App\Models\BusinessEntity;
use App\Models\Invoice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessInvoiceAttachment implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Attachment $attachment,
        public bool $isDraft = false
    ) {
    }

    /**
     * Main extraction handler using LlamaIndex AI
     */
    public function handle(): void
    {
        try {
            $filePath = Storage::path($this->attachment->path);
            $data = null;

            // Try LlamaIndex extraction
            if (config('services.llamaindex.api_key')) {
                try {
                    Log::info('Starting LlamaIndex extraction', [
                        'attachment_id' => $this->attachment->id,
                        'api_key_present' => !empty(config('services.llamaindex.api_key')),
                        'agent_id_present' => !empty(config('services.llamaindex.agent_id')),
                    ]);

                    $data = $this->extractWithLlamaIndex($filePath);

                    if ($data) {
                        Log::info('Invoice extracted via LlamaIndex', [
                            'attachment_id' => $this->attachment->id,
                            'supplier' => $data['supplier']['name'] ?? 'Unknown',
                            'number' => $data['invoice_number'] ?? '',
                            'confidence' => $data['confidence'] ?? 0,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('LlamaIndex extraction failed', [
                        'attachment_id' => $this->attachment->id,
                        'error' => $e->getMessage(),
                        'error_class' => get_class($e),
                    ]);
                }
            } else {
                Log::warning('LlamaIndex extraction skipped - API key missing', [
                    'attachment_id' => $this->attachment->id,
                ]);
            }

            // If no data from LlamaIndex, use empty template
            if (!$data) {
                $data = [
                    'type' => 'expense',
                    'supplier' => [
                        'name' => '',
                        'tax_id' => '',
                        'tax_office' => null,
                        'address' => null,
                        'city' => null,
                        'country' => null,
                        'postal_code' => null,
                        'phone' => null,
                        'mobile' => null,
                        'email' => null
                    ],
                    'invoice_number' => '',
                    'issue_date' => now()->format('Y-m-d'),
                    'due_date' => null,
                    'currency' => 'EUR',
                    'vat_percent' => 24,
                    'total_gross' => 0,
                    'total_net' => 0,
                    'vat_amount' => 0,
                    'status' => 'pending',
                    'description' => '',
                    'confidence' => 0,
                ];
            }

            $data = $this->sanitizeExtractedData($data);

            $this->attachment->update([
                'extracted_data' => $data,
                'status' => 'extracted',
                'needs_review' => ($data['confidence'] ?? 0) < 0.7,
            ]);

            // If this is a draft invoice from email, create the invoice with draft status
            if ($this->isDraft) {
                $this->createDraftInvoice($data);
            }

        } catch (\Exception $e) {
            $this->attachment->update(['status' => 'failed']);
            \Log::error('AI extract job failed', [
                'attachment_id' => $this->attachment->id ?? null,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Extract invoice data using LlamaIndex Cloud API
     */
    private function extractWithLlamaIndex(string $filePath): ?array
    {
        $apiKey = trim((string)config('services.llamaindex.api_key'));
        $agentId = trim((string)config('services.llamaindex.agent_id'));
        $baseUrl = 'https://api.cloud.llamaindex.ai/api/v1';

        if (!$apiKey || !$agentId) {
            \Log::warning('LlamaIndex configuration missing');
            return null;
        }

        // Quick auth check
        $this->checkLlamaAuth($apiKey, $baseUrl);

        // Step 1: Upload file
        $fileId = $this->uploadFileToLlamaIndex($filePath, $apiKey, $baseUrl);
        if (!$fileId) {
            return null;
        }

        // Step 2: Create extraction job
        $jobId = $this->createExtractionJob($fileId, $agentId, $apiKey, $baseUrl);
        if (!$jobId) {
            return null;
        }

        // Step 3: Poll for result (max 60 seconds)
        $result = $this->pollExtractionResult($jobId, $apiKey, $baseUrl, 60);
        if (!$result) {
            return null;
        }

        // Step 4: Map LlamaIndex response to our format
        return $this->mapLlamaIndexResponse($result);
    }

    /**
     * Upload file to LlamaIndex
     */
    private function uploadFileToLlamaIndex(string $filePath, string $apiKey, string $baseUrl): ?string
    {
        try {
            Log::info('Uploading file to LlamaIndex', [
                'file_path' => $filePath,
                'file_size' => filesize($filePath),
                'base_url' => $baseUrl,
            ]);

            $normalizedKey = $this->normalizeApiKey($apiKey);
            $response = Http::timeout(60)
                ->withToken($normalizedKey)
                ->attach('upload_file', file_get_contents($filePath), basename($filePath))
                ->post("{$baseUrl}/files");

            Log::info('LlamaIndex file upload response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body(),
            ]);

            if (!$response->successful()) {
                Log::error('LlamaIndex file upload failed', [
                    'status' => $response->status(),
                    'error' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            return $data['id'] ?? null;

        } catch (\Exception $e) {
            Log::error('LlamaIndex file upload exception', [
                'error' => $e->getMessage(),
                'class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return null;
        }
    }

    /**
     * Create extraction job
     */
    private function createExtractionJob(string $fileId, string $agentId, string $apiKey, string $baseUrl): ?string
    {
        try {
            Log::info('Creating LlamaIndex extraction job', [
                'file_id' => $fileId,
                'agent_id' => $agentId,
            ]);

            $normalizedKey = $this->normalizeApiKey($apiKey);
            $response = Http::timeout(30)
                ->withToken($normalizedKey)
                ->post("{$baseUrl}/extraction/jobs", [
                    'extraction_agent_id' => $agentId,
                    'file_id' => $fileId,
                ]);

            Log::info('LlamaIndex job creation response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if (!$response->successful()) {
                Log::error('LlamaIndex job creation failed', [
                    'status' => $response->status(),
                    'error' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            return $data['id'] ?? null;

        } catch (\Exception $e) {
            Log::error('LlamaIndex job creation exception', [
                'error' => $e->getMessage(),
                'class' => get_class($e),
            ]);
            return null;
        }
    }

    /**
     * Poll for extraction result
     */
    private function pollExtractionResult(string $jobId, string $apiKey, string $baseUrl, int $maxSeconds): ?array
    {
        $attempts = 0;
        $maxAttempts = $maxSeconds / 2; // Poll every 2 seconds

        Log::info('Starting LlamaIndex result polling', [
            'job_id' => $jobId,
            'max_seconds' => $maxSeconds,
        ]);

        while ($attempts < $maxAttempts) {
            try {
                $normalizedKey = $this->normalizeApiKey($apiKey);
                $response = Http::timeout(10)
                    ->withToken($normalizedKey)
                    ->get("{$baseUrl}/extraction/jobs/{$jobId}/result");

                if ($response->successful()) {
                    $data = $response->json();

                    Log::info('LlamaIndex poll response', [
                        'attempt' => $attempts + 1,
                        'has_data' => !empty($data['data']),
                        'status' => $response->status(),
                    ]);

                    // Check if extraction is complete
                    if (!empty($data['data'])) {
                        Log::info('LlamaIndex extraction complete', [
                            'attempts' => $attempts + 1,
                            'job_id' => $jobId,
                        ]);
                        return $data;
                    }
                }

                // Wait 2 seconds before next attempt
                sleep(2);
                $attempts++;

            } catch (\Exception $e) {
                Log::debug('LlamaIndex poll attempt failed', [
                    'attempt' => $attempts + 1,
                    'error' => $e->getMessage(),
                ]);
                sleep(2);
                $attempts++;
            }
        }

        Log::warning('LlamaIndex extraction timeout', [
            'job_id' => $jobId,
            'attempts' => $attempts,
        ]);
        return null;
    }

    /**
     * Build headers for LlamaIndex requests
     */
    private function normalizeApiKey(string $apiKey): string
    {
        $key = trim($apiKey);
        $key = preg_replace('/^Bearer\s+/i', '', $key); // strip accidental prefix
        $key = trim($key, "\"'\t\r\n "); // strip quotes/newlines
        return $key;
    }

    /**
     * Quick auth check: try to list agents to validate token/header
     */
    private function checkLlamaAuth(string $apiKey, string $baseUrl): ?bool
    {
        try {
            $normalizedKey = $this->normalizeApiKey($apiKey);
            $resp = Http::timeout(10)
                ->withToken($normalizedKey)
                ->get("{$baseUrl}/extraction/extraction-agents");

            if (!$resp->successful()) {
                \Log::warning('LlamaIndex auth check failed', [
                    'status' => $resp->status(),
                ]);
            }
            return $resp->successful();
        } catch (\Exception $e) {
            \Log::warning('LlamaIndex auth probe exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Map LlamaIndex response to our schema
     */
    private function mapLlamaIndexResponse(array $result): array
    {
        $data = $result['data'] ?? [];
        $issuer = $data['issuer'] ?? [];
        $recipient = $data['recipient'] ?? [];
        $invoice = $data['invoice'] ?? [];
        $totals = $data['totals'] ?? [];
        $lineItems = $data['line_items'] ?? [];
        $payment = $data['payment'] ?? [];
        $taxProfile = $data['tax_profile'] ?? [];

        // Determine income/expense by comparing user's tax_id with issuer/recipient
        $user = $this->attachment->user;
        $userCompany = $user->company;
        $type = 'expense'; // Default

        if ($userCompany && $userCompany->tax_id) {
            $userTaxId = $this->normalizeTaxId($userCompany->tax_id);
            $issuerTaxId = $this->normalizeTaxId($issuer['tax_id'] ?? null);
            $recipientTaxId = $this->normalizeTaxId($recipient['tax_id'] ?? null);

            // If user is the issuer → income (we issued the invoice)
            if ($userTaxId && $userTaxId === $issuerTaxId) {
                $type = 'income';
            }
            // If user is the recipient → expense (we received the invoice)
            elseif ($userTaxId && $userTaxId === $recipientTaxId) {
                $type = 'expense';
            }
        }

        // Supplier is the other party (issuer if expense, recipient if income)
        $supplierData = ($type === 'expense') ? $issuer : $recipient;
        $supplier = [
            'name' => $supplierData['name'] ?? null,
            'tax_id' => $supplierData['tax_id'] ?? null,
            'tax_office' => $supplierData['doy'] ?? null, // ΔΟΥ
            'address' => $supplierData['address'] ?? null,
            'city' => $supplierData['city'] ?? null,
            'country' => $supplierData['country'] ?? null,
            'postal_code' => $supplierData['postal_code'] ?? null,
            'phone' => $supplierData['phone'] ?? null,
            'mobile' => null,
            'email' => $supplierData['email'] ?? null,
        ];

        // Calculate VAT percent from line items or tax_profile breakdown
        $vatPercent = 24; // Default

        // If VAT not applicable (39α), force 0
        if (array_key_exists('vat_applicable', $taxProfile) && $taxProfile['vat_applicable'] === false) {
            $vatPercent = 0;
        }

        // Use most common VAT rate from line items (count manually as vat_rate is float)
        if (!empty($lineItems)) {
            $vatRateCount = [];
            foreach ($lineItems as $item) {
                $rate = floatval($item['vat_rate'] ?? 0);
                $rateKey = (string)$rate;
                $vatRateCount[$rateKey] = ($vatRateCount[$rateKey] ?? 0) + 1;
            }
            if (!empty($vatRateCount)) {
                arsort($vatRateCount);
                $mostCommonRate = array_key_first($vatRateCount);
                $vatPercent = floatval($mostCommonRate);
            }
        } elseif (!empty($taxProfile['vat_breakdown'])) {
            // Use first VAT rate from breakdown
            $vatPercent = floatval($taxProfile['vat_breakdown'][0]['vat_rate'] ?? $vatPercent);
        }

        // If totals show zero VAT, prefer 0
        if (($totals['total_vat'] ?? null) !== null && floatval($totals['total_vat']) == 0) {
            $vatPercent = 0;
        }

        // Parse date (new format is Y-m-d already)
        $issueDate = $this->parseGreekDate($invoice['invoice_date'] ?? null);

        // Build invoice number with series if present
        $invoiceNumber = trim($invoice['invoice_number'] ?? '');
        if (!empty($invoice['series'])) {
            $invoiceNumber = trim($invoice['series']) . '-' . $invoiceNumber;
        }

        // Map payment status
        $status = 'pending'; // Default
        if (!empty($payment['status'])) {
            $status = ($payment['status'] === 'paid') ? 'paid' : 'pending';
        }

        // Calculate confidence
        $confidence = $this->calculateConfidence($supplierData, $invoice);

        // Format line items into description
        $description = $this->formatLineItemsToDescription($lineItems);

        return [
            'type' => $type,
            'supplier' => $supplier,
            'invoice_number' => $invoiceNumber,
            'issue_date' => $issueDate,
            'currency' => strtoupper($invoice['currency'] ?? 'EUR'),
            'vat_percent' => $vatPercent,
            'total_gross' => floatval($totals['total_gross'] ?? 0),
            'total_net' => floatval($totals['total_net'] ?? 0),
            'vat_amount' => floatval($totals['total_vat'] ?? 0),
            'status' => $status,
            'description' => $description,
            'confidence' => $confidence,
        ];
    }

    /**
     * Parse date to Y-m-d format
     */
    private function parseGreekDate(?string $date): string
    {
        if (!$date) {
            return now()->format('Y-m-d');
        }

        try {
            // Try d/m/Y format (legacy)
            if (preg_match('#^(\d{1,2})/(\d{1,2})/(\d{4})$#', $date, $matches)) {
                $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
                $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
                $year = $matches[3];
                return "{$year}-{$month}-{$day}";
            }

            // LlamaIndex returns Y-m-d already, but parse to validate
            return \Carbon\Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            return now()->format('Y-m-d');
        }
    }

    /**
     * Calculate confidence score based on data completeness
     */
    private function calculateConfidence(array $issuer, array $invoice): float
    {
        $score = 0;
        $total = 0;

        // Critical fields (higher weight)
        $criticalFields = [
            !empty($issuer['name']) => 0.2,
            !empty($issuer['tax_id']) && strlen($issuer['tax_id']) >= 7 => 0.2,
            !empty($invoice['invoice_number']) => 0.2,
            !empty($invoice['total_gross']) && $invoice['total_gross'] > 0 => 0.2,
        ];

        foreach ($criticalFields as $exists => $weight) {
            $total += $weight;
            if ($exists) {
                $score += $weight;
            }
        }

        // Optional fields (lower weight)
        $optionalFields = [
            !empty($issuer['address']) => 0.05,
            !empty($issuer['city']) => 0.05,
            !empty($issuer['email']) => 0.05,
            !empty($invoice['invoice_date']) => 0.05,
        ];

        foreach ($optionalFields as $exists => $weight) {
            $total += $weight;
            if ($exists) {
                $score += $weight;
            }
        }

        return round($score / $total, 2);
    }

    /**
     * Create a draft invoice from extracted data
     */
    private function createDraftInvoice(array $data): void
    {
        try {
            $entity = $this->resolveBusinessEntity($data['supplier'] ?? []);

            // Check for duplicate invoice before creating
            if (!empty($data['invoice_number']) && $entity) {
                $existingInvoice = Invoice::where('user_id', $this->attachment->user_id)
                    ->where('number', $data['invoice_number'])
                    ->where('business_entity_id', $entity->id)
                    ->first();

                if ($existingInvoice) {
                    \Log::warning('Duplicate invoice detected from email - skipping creation', [
                        'invoice_number' => $data['invoice_number'],
                        'entity_id' => $entity->id,
                        'entity_name' => $entity->name,
                        'existing_invoice_id' => $existingInvoice->id,
                        'attachment_id' => $this->attachment->id,
                    ]);

                    $this->attachment->update(['status' => 'duplicate']);
                    return;
                }
            }

            $invoiceData = [
                'user_id' => $this->attachment->user_id,
                'business_entity_id' => $entity?->id,
                'type' => $data['type'] ?? 'expense',
                'status' => 'draft',
                'number' => $data['invoice_number'] ?? $data['number'] ?? '',
                'issue_date' => $data['issue_date'] ?? now()->format('Y-m-d'),
                'due_date' => $data['due_date'] ?? null,
                'currency' => $data['currency'] ?? 'EUR',
                'vat_percent' => $data['vat_percent'] ?? 24,
                'total_net' => floatval($data['total_net'] ?? 0),
                'vat_amount' => floatval($data['vat_amount'] ?? 0),
                'total_gross' => floatval($data['total_gross'] ?? 0),
                'description' => $data['description'] ?? '',
            ];

            $invoice = Invoice::create($invoiceData);

            $this->attachment->invoice_id = $invoice->id;
            $this->attachment->save();

            \Log::info('Draft invoice created from email attachment', [
                'invoice_id' => $invoice->id,
                'attachment_id' => $this->attachment->id,
                'supplier' => $entity?->name,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to create draft invoice', [
                'attachment_id' => $this->attachment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Simple sanitization without auto-corrections
     * Just clean up, trim, and ensure basic structure
     */
    private function sanitizeExtractedData(array $data): array
    {
        // Ensure all required keys exist
        $data = array_merge([
            'type' => 'expense',
            'supplier' => [],
            'invoice_number' => '',
            'issue_date' => now()->format('Y-m-d'),
            'currency' => 'EUR',
            'vat_percent' => 24,
            'total_gross' => 0,
            'total_net' => 0,
            'vat_amount' => 0,
            'status' => 'pending',
            'description' => '',
            'confidence' => 0.5,
        ], $data);

        // Ensure supplier is array
        if (!is_array($data['supplier'])) {
            $data['supplier'] = [];
        }

        // Basic trimming
        $data['invoice_number'] = trim((string)($data['invoice_number'] ?? ''));
        $data['description'] = trim((string)($data['description'] ?? ''));
        $data['type'] = in_array($data['type'], ['income', 'expense']) ? $data['type'] : 'expense';
        $data['status'] = in_array($data['status'], ['paid', 'pending']) ? $data['status'] : 'pending';
        $data['currency'] = strtoupper(trim((string)($data['currency'] ?? 'EUR')));

        // Supplier field cleanup
        foreach (['name', 'tax_id', 'tax_office', 'address', 'city', 'country', 'postal_code', 'phone', 'mobile', 'email'] as $field) {
            $data['supplier'][$field] = trim((string)($data['supplier'][$field] ?? '')) ?: null;
        }

        // Validate tax ID format - clear if obviously invalid (too long/short, non-numeric)
        if (!empty($data['supplier']['tax_id'])) {
            $normalized = $this->normalizeTaxId($data['supplier']['tax_id']);
            // Only reject if format is completely wrong (not 9 digits for Greek, or obviously not a tax ID)
            if (!$normalized || strlen($normalized) < 7 || strlen($normalized) > 12) {
                \Log::warning('Invalid tax ID format cleared during extraction', [
                    'attachment_id' => $this->attachment->id,
                    'invalid_tax_id' => $data['supplier']['tax_id'],
                ]);
                $data['supplier']['tax_id'] = null;
            }
        }

        // Cast numbers
        $data['vat_percent'] = floatval($data['vat_percent'] ?? 24);
        $data['total_gross'] = floatval($data['total_gross'] ?? 0);
        $data['total_net'] = floatval($data['total_net'] ?? 0);
        $data['vat_amount'] = floatval($data['vat_amount'] ?? 0);
        $data['confidence'] = max(0, min(1, floatval($data['confidence'] ?? 0.5)));

        // Only validate issue_date format, don't auto-correct
        try {
            if (!empty($data['issue_date'])) {
                $data['issue_date'] = \Carbon\Carbon::parse($data['issue_date'])->format('Y-m-d');
            } else {
                $data['issue_date'] = now()->format('Y-m-d');
            }
        } catch (\Exception $e) {
            $data['issue_date'] = now()->format('Y-m-d');
        }

        // Remove any extra keys not in schema
        $allowed = ['type', 'supplier', 'invoice_number', 'issue_date', 'currency', 'vat_percent', 'total_gross', 'total_net', 'vat_amount', 'status', 'description', 'confidence'];
        foreach (array_keys($data) as $key) {
            if (!in_array($key, $allowed)) {
                unset($data[$key]);
            }
        }

        return $data;
    }

    private function resolveBusinessEntity(array $supplier): ?BusinessEntity
    {
        if (empty($supplier)) {
            return null;
        }

        $taxId = $this->normalizeTaxId($supplier['tax_id'] ?? null);
        $name = trim($supplier['name'] ?? '') ?: 'Unknown';

        // First try to find by tax ID
        if ($taxId) {
            $existing = BusinessEntity::where('user_id', $this->attachment->user_id)
                ->where('tax_id', $taxId)
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        // Try to find by name
        $existingByName = BusinessEntity::where('user_id', $this->attachment->user_id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->first();

        if ($existingByName) {
            // Check if Tax IDs differ (potential OCR error)
            if ($taxId && $existingByName->tax_id && $taxId !== $existingByName->tax_id) {
                \Log::warning('Email import: Same company name with different Tax ID', [
                    'attachment_id' => $this->attachment->id,
                    'company_name' => $name,
                    'existing_tax_id' => $existingByName->tax_id,
                    'extracted_tax_id' => $taxId,
                    'user_id' => $this->attachment->user_id,
                ]);
            }

            return $existingByName;
        }

        // Create new entity
        return BusinessEntity::create([
            'user_id' => $this->attachment->user_id,
            'name' => $name,
            'tax_id' => $taxId,
            'tax_office' => $supplier['tax_office'] ?? null,
            'email' => $supplier['email'] ?? null,
            'country' => $supplier['country'] ?? null,
            'city' => $supplier['city'] ?? null,
            'address' => $supplier['address'] ?? null,
            'postal_code' => $supplier['postal_code'] ?? null,
            'phone' => $supplier['phone'] ?? null,
            'mobile' => $supplier['mobile'] ?? null,
            'type' => 'supplier',
        ]);
    }

    private function normalizeTaxId(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value);
        return $digits ?: null;
    }

    /**
     * Format line items to simple description string
     * Example: "2x Item 1, 1x Item 2, 3x Item 3"
     */
    private function formatLineItemsToDescription(array $lineItems): string
    {
        if (empty($lineItems)) {
            return '';
        }

        $formatted = [];
        foreach ($lineItems as $item) {
            $description = trim($item['description'] ?? '');
            $quantity = $item['quantity'] ?? 1;

            if ($description) {
                // Format quantity (remove .0 if integer)
                $qtyStr = (floor($quantity) == $quantity) ? (int)$quantity : $quantity;
                $formatted[] = "{$qtyStr}x {$description}";
            }
        }

        return implode(', ', $formatted);
    }
}
