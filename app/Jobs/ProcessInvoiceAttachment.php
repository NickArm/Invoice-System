<?php

namespace App\Jobs;

use App\Models\Attachment;
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
        public Attachment $attachment
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
        $instructions .= "   - The supplier Tax ID (ΑΦΜ) is EXACTLY 9 digits (sometimes 10)\n";
        $instructions .= "   - DO NOT use ΑΡ.ΓΕΜΗ (GEMI number) as Tax ID - it's usually 12+ digits\n";
        $instructions .= "   - Look for 'ΑΦΜ:' or 'Α.Φ.Μ.' label followed by 9-digit number\n";
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
        $instructions .= "   type: 'income' or 'expense'\n";
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

            $this->attachment->update([
                'extracted_data' => $data,
                'status' => 'extracted',
            ]);

        } catch (\Exception $e) {
            $this->attachment->update(['status' => 'failed']);
            \Log::error('AI extract job failed', [
                'attachment_id' => $this->attachment->id ?? null,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
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
