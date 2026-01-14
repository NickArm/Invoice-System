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
use OpenAI\Laravel\Facades\OpenAI;

class ProcessInvoiceAttachment implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Attachment $attachment,
        public bool $isDraft = false // New parameter for draft mode
    ) {
    }

    private function buildInstructionPrompt(): string
    {
        $user = $this->attachment->user;
        $company = $user->company;

        $instructions = "Extract invoice data from this document and return as JSON.\n\n";

        // Add company context if available
        if ($company) {
            $instructions .= "CONTEXT - This is the recipient company information (DO NOT extract this as supplier):\n";
            $instructions .= "- Recipient Name: {$company->name}\n";
            $instructions .= "- Recipient Tax ID: {$company->tax_id}\n";
            $instructions .= "- Recipient Email: {$company->email}\n";
            $instructions .= "This information helps you identify which party is the recipient vs the supplier/issuer.\n\n";
        }

        $instructions .= "CRITICAL RULES:\n";
        $instructions .= "1. **SUPPLIER (Εκδότης/From)**: The company that ISSUED the invoice (usually at TOP of document)\n";
        $instructions .= "   - For Greek: Look for 'ΕΚΔΟΤΗΣ', 'ΠΩΛΗΤΗΣ', or company details near the header/logo\n";
        $instructions .= "   - The supplier name is the OFFICIAL company name (e.g., 'ELECTROINVEST A.E.'), NOT brand names or person names\n";
        $instructions .= "   - **TAX ID (ΑΦΜ) EXTRACTION - CRITICAL**:\n";
        $instructions .= "     * Tax ID is EXACTLY 9 digits (rarely 10 for special cases)\n";
        $instructions .= "     * Look CAREFULLY for the label 'ΑΦΜ:' or 'Α.Φ.Μ.' followed by the number\n";
        $instructions .= "     * The Tax ID appears NEAR the company name in the header/issuer section\n";
        $instructions .= "     * DOUBLE-CHECK: Count the digits - must be 9 digits exactly\n";
        $instructions .= "     * DO NOT confuse with:\n";
        $instructions .= "       - ΑΡ.ΓΕΜΗ / ΑΡΙΘΜΟΣ ΓΕΜΗ (12+ digits) - this is NOT Tax ID\n";
        $instructions .= "       - Invoice number\n";
        $instructions .= "       - Phone numbers\n";
        $instructions .= "       - Postal codes\n";
        $instructions .= "     * If you find multiple 9-digit numbers, choose the one labeled 'ΑΦΜ' or closest to company name\n";
        $instructions .= "     * VERIFY: Re-read the Tax ID field before finalizing to ensure accuracy\n";
        $instructions .= "   - If you see 'ΕΠΩΝΥΜΙΑ' or 'ΕΤΑΙΡΙΚΗ ΜΟΡΦΗ' near the top, that's the official supplier name\n\n";

        $instructions .= "2. **RECIPIENT (Παραλήπτης/To)**: The company that RECEIVES the invoice\n";
        $instructions .= "   - For Greek: Look for 'ΠΑΡΑΛΗΠΤΗΣ', 'ΑΓΟΡΑΣΤΗΣ', 'ΠΕΛΑΤΗΣ'\n";
        $instructions .= "   - This is usually in the middle/lower section labeled 'Στοιχεία Πελάτη' or similar\n";
        $instructions .= "   - DO NOT use recipient details as supplier details\n\n";

        $instructions .= "3. **DESCRIPTION**: \n";
        $instructions .= "   - ONLY extract if there's a business activity/description field in the SUPPLIER section (header area, usually top-right)\n";
        $instructions .= "   - For Greek: Look for 'ΔΡΑΣΤΗΡΙΟΤΗΤΑ', 'ΕΠΑΓΓΕΛΜΑ', 'BUSINESS ACTIVITY' near supplier details\n";
        $instructions .= "   - DO NOT extract from items/products list\n";
        $instructions .= "   - DO NOT use recipient's information\n";
        $instructions .= "   - If no activity/description in supplier section, leave EMPTY (empty string)\n\n";

        $instructions .= "4. For Greek invoices field labels:\n";
        $instructions .= "   - 'ΑΦΜ' or 'Α.Φ.Μ.' = Tax ID (EXACTLY 9 digits, rarely 10)\n";
        $instructions .= "   - 'ΑΡ.ΓΕΜΗ' or 'ΑΡΙΘΜΟΣ ΓΕΜΗ' = GEMI number (12+ digits) - DO NOT use as Tax ID\n";
        $instructions .= "   - 'Α/Α ΤΙΜΟΛΟΓΙΟΥ' or 'ΑΡΙΘΜΟΣ' = Invoice Number\n";
        $instructions .= "   - 'ΗΜΕΡΟΜΗΝΙΑ ΕΚΔΟΣΗΣ' = Issue Date\n";
        $instructions .= "   - 'ΣΥΝΟΛΟ' or 'ΤΕΛΙΚΟ ΠΟΣΟ' = Total Amount\n";
        $instructions .= "   - 'ΦΠΑ' = VAT\n\n";

        $instructions .= "5. Return JSON with fields (MAPPING RULE):\n";
        $instructions .= "   type: 'income' or 'expense' (default to 'expense' unless you clearly see the user's company as the issuer)\n";
        $instructions .= "   supplier: {name, tax_id, tax_office, address, city, country, postal_code, phone, mobile, email}\n";
        $instructions .= "      - IF type = 'expense': supplier = ISSUER (other party)\n";
        $instructions .= "      - IF type = 'income': supplier = RECIPIENT/BUYER (the other party, NOT the user's own company)\n";
        $instructions .= "      - Extract ALL available fields from the supplier/issuer section:\n";
        $instructions .= "        * tax_office: For Greek invoices, look for 'ΔΟΥ' (tax office) - e.g., 'ΔΟΥ ΑΘΗΝΩΝ'\n";
        $instructions .= "        * address: Full street address (e.g., 'ΛΕΩΦΟΡΟΣ ΚΗΦΙΣΙΑΣ 12')\n";
        $instructions .= "        * city: City name (e.g., 'ΑΘΗΝΑ', 'ΘΕΣΣΑΛΟΝΙΚΗ')\n";
        $instructions .= "        * country: Country (usually 'GREECE' or 'ΕΛΛΑΔΑ' for Greek invoices, or extract if stated)\n";
        $instructions .= "        * postal_code: Postal/ZIP code (e.g., '15231')\n";
        $instructions .= "        * phone: Primary phone number (look for 'ΤΗΛ:', 'TEL:', 'ΤΗΛΕΦΩΝΟ')\n";
        $instructions .= "        * mobile: Mobile number (look for 'ΚΙΝΗΤΟ:', 'MOBILE:', 'ΚΙΝ:')\n";
        $instructions .= "        * email: Email address if present\n";
        $instructions .= "      - If any field is not found, use null or empty string\n";
        $instructions .= "   invoice_number: string\n";
        $instructions .= "   issue_date: YYYY-MM-DD\n";
        $instructions .= "   due_date: YYYY-MM-DD or null\n";
        $instructions .= "   currency: EUR, GBP, USD, etc\n";
        $instructions .= "   vat_percent: number (e.g., 24 for 24%)\n";
        $instructions .= "   total_gross: number\n";
        $instructions .= "   total_net: number\n";
        $instructions .= "   vat_amount: number\n";
        $instructions .= "   status: 'paid' or 'pending' (if you see 'ΕΠΙ ΠΙΣΤΩΣΗ' or 'ON CREDIT' text, set to 'pending', otherwise 'paid')\n";
        $instructions .= "   description: string (from supplier section only, or empty string)\n";
        $instructions .= "   items: [] (always empty array - ignore items)\n";
        $instructions .= "   confidence: 0-1 (how confident about extraction)";

        return $instructions;
    }

    public function handle(): void
    {
        try {
            $filePath = Storage::path($this->attachment->path);
            [$base64Content, $mimeType] = $this->prepareFileForOpenAI($filePath, $this->attachment->mime_type);
            $fileSize = $base64Content ? strlen($base64Content) : 0;

            $data = null;

            // Try OpenAI if key is configured and we have image content
            if (config('openai.api_key') && $base64Content) {
                try {
                    $prompt = $this->buildInstructionPrompt();

                    $response = OpenAI::chat()->create([
                        'model' => 'gpt-4o',
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => 'You are an expert at extracting structured financial data from invoices in multiple languages (English, Greek, etc). Extract all relevant fields and return as valid JSON. Be especially careful with invoice number, dates, and amounts.',
                            ],
                            [
                                'role' => 'user',
                                'content' => [
                                    [
                                        'type' => 'text',
                                        'text' => $prompt,
                                    ],
                                    $this->imageContentPayload($base64Content, $mimeType),
                                ],
                            ],
                        ],
                        'response_format' => ['type' => 'json_object'],
                    ]);

                    $data = json_decode($response->choices[0]->message->content, true);

                } catch (\Exception $e) {
                    \Log::warning('OpenAI extraction failed', [
                        'attachment_id' => $this->attachment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                \Log::warning('OpenAI extraction skipped', [
                    'attachment_id' => $this->attachment->id,
                    'reason' => $base64Content ? 'API key missing' : 'no image content (conversion failed)',
                ]);
            }

            // If no data from OpenAI, use empty template
            if (!$data) {
                $data = [
                    'type' => 'expense',
                    'supplier' => ['name' => '', 'tax_id' => ''],
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
                    'items' => [],
                    'confidence' => 0,
                ];

            }

            $data = $this->normalizeExtraction($data);

            // AFM correction: if AI-afm invalid and we have a PDF, try extracting text via pdftotext
            $afm = $this->normalizeTaxId($data['supplier']['tax_id'] ?? null);
            if (!$this->isValidGreekTaxId($afm) && str_starts_with($mimeType, 'application/pdf')) {
                $pdfText = $this->extractPdfTextWithPoppler($filePath);
                if ($pdfText) {
                    $textAfm = $this->extractTaxIdFromText($pdfText);
                    if ($textAfm && $this->isValidGreekTaxId($textAfm)) {
                        $data['supplier']['tax_id'] = $textAfm;
                        \Log::info('AFM corrected via pdftotext fallback', [
                            'attachment_id' => $this->attachment->id,
                            'old_afm' => $afm,
                            'new_afm' => $textAfm,
                        ]);
                    }
                }
            }

            $this->attachment->update([
                'extracted_data' => $data,
                'status' => 'extracted',
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

                    // Mark attachment as processed but don't create duplicate invoice
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

            // Attach the attachment to the invoice
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
     * Force safer defaults and normalize extracted payload
     */
    private function normalizeExtraction(array $data): array
    {
        $company = $this->attachment->user?->company;
        $companyTax = $company?->tax_id ? $this->normalizeTaxId($company->tax_id) : null;

        // Default type to expense for email imports unless we are clearly the issuer
        $extractedSupplierTax = $data['supplier']['tax_id'] ?? null;
        $normalizedSupplierTax = $extractedSupplierTax ? $this->normalizeTaxId($extractedSupplierTax) : null;

        $type = $data['type'] ?? 'expense';
        if ($this->isDraft) {
            $type = 'expense';
            if ($companyTax && $normalizedSupplierTax && $companyTax === $normalizedSupplierTax) {
                $type = 'income';
            }
        }

        $data['type'] = in_array($type, ['income', 'expense']) ? $type : 'expense';

        // Normalize dates to Y-m-d if possible
        foreach (['issue_date', 'due_date'] as $dateKey) {
            if (!empty($data[$dateKey])) {
                try {
                    $data[$dateKey] = \Carbon\Carbon::parse($data[$dateKey])->format('Y-m-d');
                } catch (\Exception $e) {
                    $data[$dateKey] = $dateKey === 'issue_date' ? now()->format('Y-m-d') : null;
                }
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

                    // Use existing entity but log the discrepancy
                    // User can manually review draft invoices
                    return $existingByName;
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

    private function prepareFileForOpenAI(string $filePath, string $mimeType): array
    {
        // If PDF, try to convert first page to PNG for Vision API
        if (str_starts_with($mimeType, 'application/pdf')) {
            try {
                if (!extension_loaded('imagick')) {
                    \Log::warning('Imagick not available; cannot convert PDF to image', ['attachment_id' => $this->attachment->id]);
                    // Try CLI fallback (pdftoppm/poppler) when Imagick is missing
                    $fallback = $this->convertPdfWithPoppler($filePath);
                    if ($fallback) {
                        return [$fallback, 'image/png'];
                    }

                    return [null, $mimeType];
                }

                $imagick = new \Imagick();
                $imagick->setResolution(200, 200);
                $imagick->readImage($filePath.'[0]'); // first page
                $imagick->setImageFormat('png');
                $pngData = $imagick->getImageBlob();
                $imagick->clear();
                $imagick->destroy();

                return [base64_encode($pngData), 'image/png'];
            } catch (\Exception $e) {
                \Log::warning('PDF to image conversion failed', [
                    'attachment_id' => $this->attachment->id,
                    'error' => $e->getMessage(),
                ]);
                // Try CLI fallback (pdftoppm/poppler) when Imagick conversion fails
                $fallback = $this->convertPdfWithPoppler($filePath);
                if ($fallback) {
                    return [$fallback, 'image/png'];
                }

                return [null, $mimeType];
            }
        }

        // For image files, return base64 directly
        return [base64_encode(file_get_contents($filePath)), $mimeType];
    }

    // Fallback conversion for PDF->PNG using poppler's pdftoppm if Imagick is unavailable.
    private function convertPdfWithPoppler(string $filePath): ?string
    {
        $tempBase = tempnam(sys_get_temp_dir(), 'pdf2img_');
        if ($tempBase === false) {
            \Log::warning('pdftoppm fallback failed: temp file not created', ['attachment_id' => $this->attachment->id]);
            return null;
        }

        // pdftoppm adds "-1" suffix for the first page (e.g., "base-1.png")
        $outputPng = $tempBase.'-1.png';

        // Try to locate pdftoppm in common Windows paths
        $pdftoppmBinary = $this->findPdftoppm();
        if (!$pdftoppmBinary) {
            \Log::warning('pdftoppm binary not found in PATH', ['attachment_id' => $this->attachment->id]);
            @unlink($tempBase);
            return null;
        }

        $process = new Process([$pdftoppmBinary, '-f', '1', '-l', '1', '-png', $filePath, $tempBase]);
        $process->setTimeout(20);
        $process->run();

        if (!$process->isSuccessful()) {
            \Log::warning('pdftoppm conversion failed', [
                'attachment_id' => $this->attachment->id,
                'exit_code' => $process->getExitCode(),
                'error' => $process->getErrorOutput(),
            ]);
            @unlink($outputPng);
            @unlink($tempBase);
            return null;
        }

        if (!file_exists($outputPng)) {
            \Log::warning('pdftoppm did not produce PNG output', ['attachment_id' => $this->attachment->id, 'expected' => $outputPng]);
            @unlink($tempBase);
            return null;
        }
    $pngData = base64_encode(file_get_contents($outputPng));

        // Cleanup temp files
        @unlink($outputPng);
        @unlink($tempBase);

        return $pngData ?: null;
    }

    // Helper to find pdftoppm binary in PATH or common Windows locations
    private function findPdftoppm(): ?string
    {
        // Try common Windows installation paths (check first since PATH may not be updated in queue worker)
        $commonPaths = [
            'C:\\xampp82\\poppler\\Library\\bin\\pdftoppm.exe',
            'C:\\Program Files\\Poppler\\bin\\pdftoppm.exe',
            'C:\\Program Files (x86)\\Poppler\\bin\\pdftoppm.exe',
            'C:\\tools\\poppler\\bin\\pdftoppm.exe',
        ];

        foreach ($commonPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        // Try direct command (if in PATH)
        $process = new Process(['where', 'pdftoppm']);
        $process->run();
        if ($process->isSuccessful()) {
            $path = trim($process->getOutput());
            if (!empty($path)) {
                return $path;
            }
        }

        return null;
    }

    // Extract full text from PDF using poppler's pdftotext
    private function extractPdfTextWithPoppler(string $filePath): ?string
    {
        $pdftotext = $this->findPdftotext();
        if (!$pdftotext) {
            \Log::debug('pdftotext binary not found');
            return null;
        }

        $tempTxt = tempnam(sys_get_temp_dir(), 'pdf2txt_');
        if ($tempTxt === false) {
            return null;
        }

        // -layout keeps visual layout which helps with labels like ΑΦΜ
        $process = new Process([$pdftotext, '-layout', $filePath, $tempTxt]);
        $process->setTimeout(20);
        $process->run();

        if (!$process->isSuccessful()) {
            \Log::debug('pdftotext failed', ['exit' => $process->getExitCode(), 'err' => $process->getErrorOutput()]);
            @unlink($tempTxt);
            return null;
        }

        $text = @file_get_contents($tempTxt) ?: null;
        @unlink($tempTxt);
        return $text;
    }

    // Locate pdftotext on Windows
    private function findPdftotext(): ?string
    {
        $commonPaths = [
            'C:\\xampp82\\poppler\\Library\\bin\\pdftotext.exe',
            'C:\\Program Files\\Poppler\\bin\\pdftotext.exe',
            'C:\\Program Files (x86)\\Poppler\\bin\\pdftotext.exe',
            'C:\\tools\\poppler\\bin\\pdftotext.exe',
        ];

        foreach ($commonPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        $process = new Process(['where', 'pdftotext']);
        $process->run();
        if ($process->isSuccessful()) {
            $path = trim($process->getOutput());
            if (!empty($path)) {
                return $path;
            }
        }
        return null;
    }

    // Extract AFM value from text using Greek labels and checksum validation
    private function extractTaxIdFromText(string $text): ?string
    {
        // Try explicit ΑΦΜ label first
        $pattern = '/Α\s*\.?\s*Φ\s*\.?\s*Μ\s*[:\-]?\s*(\d{9,10})/u';
        if (preg_match($pattern, $text, $m)) {
            $candidate = $this->normalizeTaxId($m[1]);
            if ($this->isValidGreekTaxId($candidate)) {
                return $candidate;
            }
        }

        // Fallback: scan for any 9-10 digit sequences and pick the first valid by checksum
        if (preg_match_all('/\b(\d{9,10})\b/u', $text, $matches)) {
            foreach ($matches[1] as $num) {
                $candidate = $this->normalizeTaxId($num);
                if ($this->isValidGreekTaxId($candidate)) {
                    return $candidate;
                }
            }
        }
        return null;
    }


    // Validate Greek AFM using checksum (first 8 digits weighted by powers of 2, result mod 11, then mod 10)
    private function isValidGreekTaxId(?string $afm): bool
    {
        if (!$afm) return false;
        if (!preg_match('/^\d{9}$/', $afm)) return false;
        $sum = 0;
        // weights: 2,4,8,16,32,64,128,256 for digits 1..8
        for ($i = 0; $i < 8; $i++) {
            $digit = intval($afm[$i]);
            $weight = 1 << ($i + 1); // 2^(i+1)
            $sum += $digit * $weight;
        }
        $remainder = $sum % 11;
        $check = $remainder % 10;
        return intval($afm[8]) === $check;
    }

    private function imageContentPayload(?string $base64Content, string $mimeType): array
    {
        return [
            'type' => 'image_url',
            'image_url' => [
                'url' => $base64Content ? "data:{$mimeType};base64,{$base64Content}" : '',
            ],
        ];
    }
}
