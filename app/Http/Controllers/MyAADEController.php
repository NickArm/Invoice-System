<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\BusinessEntity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use SimpleXMLElement;

class MyAADEController extends Controller
{
    private const MYDATA_BASE_URL = 'https://mydatapi.aade.gr/myDATA';

    /**
     * Fetch invoices from myDATA API
     * Supports both income and expenses
     */
    public function fetch(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:income,expenses',
            'date_from' => 'required|date_format:d/m/Y',
            'date_to' => 'required|date_format:d/m/Y|after_or_equal:date_from',
        ]);

        $user = auth()->user();

        // Check if credentials are set
        if (!$user->aade_username || !$user->mydata_subscription_key) {
            return response()->json([
                'success' => false,
                'message' => 'myDATA credentials not configured. Please set them in Settings.',
                'data' => []
            ], 422);
        }

        try {
            $endpoint = $validated['type'] === 'income' ? 'RequestMyIncome' : 'RequestMyExpenses';
            $url = sprintf(
                '%s/%s?dateFrom=%s&dateTo=%s',
                self::MYDATA_BASE_URL,
                $endpoint,
                $validated['date_from'],
                $validated['date_to']
            );

            Log::info('Fetching from myDATA', [
                'endpoint' => $endpoint,
                'date_from' => $validated['date_from'],
                'date_to' => $validated['date_to'],
                'user_id' => $user->id,
            ]);

            $response = $this->callMyDataApi($url, $user->aade_username, $user->mydata_subscription_key);

            if (!$response['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'],
                    'data' => []
                ], 400);
            }

            $bookInfo = $this->parseBookInfo($response['body']);

            // Check for matching uploaded invoices
            $bookInfo = $this->enrichWithUploadStatus($bookInfo, $validated['type'], $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Data fetched successfully',
                'data' => $bookInfo,
                'count' => count($bookInfo)
            ]);

        } catch (\Exception $e) {
            Log::error('myDATA fetch failed', [
                'error' => $e->getMessage(),
                'type' => $validated['type'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch data from myDATA: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Call myDATA API with proper headers
     */
    private function callMyDataApi(string $url, string $username, string $subscriptionKey): array
    {
        try {
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => [
                    'aade-user-id: ' . $username,
                    'ocp-apim-subscription-key: ' . $subscriptionKey,
                    'Content-Type: application/xml',
                ],
            ]);

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            if ($httpCode !== 200) {
                $errorMsg = "myDATA API returned status $httpCode";
                
                // Try to extract meaningful error message from response
                if ($response && is_string($response)) {
                    // Try to parse as JSON first
                    $jsonData = json_decode($response, true);
                    if ($jsonData && isset($jsonData['message'])) {
                        $errorMsg = $jsonData['message'];
                    } else {
                        // Fallback to stripping tags
                        $extracted = trim(strip_tags($response));
                        if (!empty($extracted)) {
                            $errorMsg = $extracted;
                        }
                    }
                }

                Log::warning('myDATA API returned error', [
                    'http_code' => $httpCode,
                    'url' => $url,
                    'message' => $errorMsg,
                    'response_preview' => substr($response, 0, 500),
                ]);

                return [
                    'success' => false,
                    'message' => $errorMsg,
                    'body' => $response
                ];
            }

            return [
                'success' => true,
                'message' => 'Request successful',
                'body' => $response
            ];

        } catch (\Exception $e) {
            Log::error('myDATA API call failed', [
                'error' => $e->getMessage(),
                'url' => $url,
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'body' => null
            ];
        }
    }

    /**
     * Parse XML response and extract bookInfo elements
     */
    private function parseBookInfo(string $xmlString): array
    {
        try {
            $xml = simplexml_load_string($xmlString);

            if ($xml === false) {
                throw new \Exception('Invalid XML response');
            }

            $bookInfoList = [];

            foreach ($xml->bookInfo as $book) {
                $bookInfoList[] = [
                    'counterVatNumber' => (string)$book->counterVatNumber,
                    'issueDate' => (string)$book->issueDate,
                    'invType' => (string)$book->invType,
                    'netValue' => floatval($book->netValue),
                    'vatAmount' => floatval($book->vatAmount),
                    'withheldAmount' => floatval($book->withheldAmount),
                    'otherTaxesAmount' => floatval($book->otherTaxesAmount),
                    'stampDutyAmount' => floatval($book->stampDutyAmount),
                    'feesAmount' => floatval($book->feesAmount),
                    'deductionsAmount' => floatval($book->deductionsAmount),
                    'thirdPartyAmount' => floatval($book->thirdPartyAmount),
                    'grossValue' => floatval($book->grossValue),
                    'count' => intval($book->count),
                    'minMark' => (string)$book->minMark,
                    'maxMark' => (string)$book->maxMark,
                ];
            }

            return $bookInfoList;

        } catch (\Exception $e) {
            Log::error('XML parsing failed', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Enrich book info with upload status by matching against invoices
     * Matches by: counterVatNumber (business entity tax_id), issueDate, and grossValue
     */
    private function enrichWithUploadStatus(array $bookInfoList, string $type, int $userId): array
    {
        return array_map(function ($bookInfo) use ($type, $userId) {
            // Find matching invoice
            $matchingInvoice = $this->findMatchingInvoice(
                $bookInfo['counterVatNumber'],
                $bookInfo['issueDate'],
                $bookInfo['grossValue'],
                $userId
            );

            $bookInfo['uploaded'] = $matchingInvoice ? true : false;
            $bookInfo['invoice_id'] = $matchingInvoice?->id;

            return $bookInfo;
        }, $bookInfoList);
    }

    /**
     * Get detailed transaction information from myDATA
     * Calls RequestTransmittedDocs to get line items for a specific mark
     */
    public function getDetails(Request $request)
    {
        $validated = $request->validate([
            'mark' => 'required|string',
        ]);

        $user = auth()->user();

        // Check if credentials are set
        if (!$user->aade_username || !$user->mydata_subscription_key) {
            return response()->json([
                'success' => false,
                'message' => 'myDATA credentials not configured.',
                'data' => []
            ], 422);
        }

        try {
            $url = sprintf(
                '%s/RequestTransmittedDocs?mark=%s',
                self::MYDATA_BASE_URL,
                $validated['mark']
            );

            Log::info('Fetching transaction details from myDATA', [
                'mark' => $validated['mark'],
                'user_id' => $user->id,
            ]);

            $response = $this->callMyDataApi($url, $user->aade_username, $user->mydata_subscription_key);

            if (!$response['success']) {
                // Extract error message from API response
                $errorMsg = $response['message'];
                if ($response['body'] && is_string($response['body'])) {
                    // Try to parse as JSON first
                    $jsonData = json_decode($response['body'], true);
                    if ($jsonData && isset($jsonData['message'])) {
                        $errorMsg = $jsonData['message'];
                    } else {
                        // Fallback to stripping tags
                        $errorMsg = trim(strip_tags($response['body']));
                    }
                }
                
                Log::warning('RequestTransmittedDocs API error', [
                    'message' => $errorMsg,
                    'response_body' => substr($response['body'], 0, 500),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => $errorMsg,
                    'data' => []
                ], 400);
            }

            Log::debug('RequestTransmittedDocs response received', [
                'body_length' => strlen($response['body']),
                'first_500_chars' => substr($response['body'], 0, 500),
            ]);

            $details = $this->parseTransmittedDocs($response['body']);

            // If no details found, return aggregated data from the bookInfo
            if (empty($details)) {
                Log::info('No detailed docs found, returning aggregated data only', [
                    'mark' => $validated['mark'],
                ]);
                
                // Return empty array - frontend will show message
                return response()->json([
                    'success' => true,
                    'message' => 'Transaction details fetched (aggregated data only)',
                    'data' => [],
                    'note' => 'Detailed line items not available from myDATA API for this mark'
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Details fetched successfully',
                'data' => $details,
                'count' => count($details)
            ]);

        } catch (\Exception $e) {
            Log::error('myDATA details fetch failed', [
                'error' => $e->getMessage(),
                'mark' => $validated['mark'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch details: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Parse RequestTransmittedDocs XML response to extract transmitted document details
     */
    private function parseTransmittedDocs(string $xmlString): array
    {
        try {
            Log::debug('Parsing XML response', [
                'xml_length' => strlen($xmlString),
                'first_1000_chars' => substr($xmlString, 0, 1000),
            ]);

            // Check if response is empty or error
            if (empty($xmlString) || strpos($xmlString, '<?xml') === false) {
                Log::warning('Invalid XML response received', [
                    'is_empty' => empty($xmlString),
                    'content' => $xmlString,
                ]);
                return [];
            }

            $xml = simplexml_load_string($xmlString);

            if ($xml === false) {
                Log::error('XML parse error', [
                    'xml_string' => $xmlString,
                    'libxml_errors' => libxml_get_errors(),
                ]);
                return [];
            }

            Log::debug('XML loaded successfully', [
                'root_element' => $xml->getName(),
                'children_count' => count($xml->children()),
            ]);

            $docsList = [];

            // Root is RequestedDoc, look for invoicesDoc
            $invoicesDoc = $xml->invoicesDoc ?? $xml->InvoicesDoc ?? null;
            
            if (!$invoicesDoc) {
                Log::warning('No invoicesDoc element found in response', [
                    'root' => $xml->getName(),
                    'children' => array_keys((array)$xml),
                ]);
                return [];
            }

            // Iterate through invoices
            foreach ($invoicesDoc->invoice ?? $invoicesDoc->Invoice ?? [] as $invoice) {
                Log::debug('Processing invoice element', [
                    'mark' => (string)($invoice->mark ?? $invoice->Mark ?? ''),
                ]);

                $docData = [
                    'mark' => (string)($invoice->mark ?? $invoice->Mark ?? ''),
                    'uid' => (string)($invoice->uid ?? $invoice->Uid ?? ''),
                    'issuer' => [
                        'vatNumber' => (string)($invoice->issuer->vatNumber ?? $invoice->issuer->VatNumber ?? $invoice->Issuer->VatNumber ?? ''),
                        'name' => (string)($invoice->issuer->name ?? $invoice->issuer->Name ?? $invoice->Issuer->Name ?? ''),
                        'branch' => (string)($invoice->issuer->branch ?? $invoice->issuer->Branch ?? $invoice->Issuer->Branch ?? ''),
                        'address' => (string)($invoice->issuer->address ?? $invoice->issuer->Address ?? $invoice->Issuer->Address ?? ''),
                        'city' => (string)($invoice->issuer->city ?? $invoice->issuer->City ?? $invoice->Issuer->City ?? ''),
                        'postalCode' => (string)($invoice->issuer->postalCode ?? $invoice->issuer->PostalCode ?? $invoice->Issuer->PostalCode ?? ''),
                    ],
                    'counterpart' => [
                        'vatNumber' => (string)($invoice->counterpart->vatNumber ?? $invoice->counterpart->VatNumber ?? $invoice->Counterpart->VatNumber ?? ''),
                        'name' => (string)($invoice->counterpart->name ?? $invoice->counterpart->Name ?? $invoice->Counterpart->Name ?? ''),
                        'branch' => (string)($invoice->counterpart->branch ?? $invoice->counterpart->Branch ?? $invoice->Counterpart->Branch ?? ''),
                        'address' => (string)($invoice->counterpart->address ?? $invoice->counterpart->Address ?? $invoice->Counterpart->Address ?? ''),
                        'city' => (string)($invoice->counterpart->city ?? $invoice->counterpart->City ?? $invoice->Counterpart->City ?? ''),
                        'postalCode' => (string)($invoice->counterpart->postalCode ?? $invoice->counterpart->PostalCode ?? $invoice->Counterpart->PostalCode ?? ''),
                    ],
                    'issueDate' => (string)($invoice->issueDate ?? $invoice->IssueDate ?? ''),
                    'invoiceType' => (string)($invoice->invoiceType ?? $invoice->InvoiceType ?? ''),
                    'series' => (string)($invoice->series ?? $invoice->Series ?? ''),
                    'aa' => (string)($invoice->aa ?? $invoice->AA ?? ''),
                    'vatAmount' => floatval($invoice->vatAmount ?? $invoice->VatAmount ?? 0),
                    'netAmount' => floatval($invoice->netAmount ?? $invoice->NetAmount ?? 0),
                    'grossAmount' => floatval($invoice->grossAmount ?? $invoice->GrossAmount ?? 0),
                    'stampDutyAmount' => floatval($invoice->stampDutyAmount ?? $invoice->StampDutyAmount ?? 0),
                    'otherTaxesAmount' => floatval($invoice->otherTaxesAmount ?? $invoice->OtherTaxesAmount ?? 0),
                    'withheldAmount' => floatval($invoice->withheldAmount ?? $invoice->WithheldAmount ?? 0),
                    'feesAmount' => floatval($invoice->feesAmount ?? $invoice->FeesAmount ?? 0),
                    'deductionsAmount' => floatval($invoice->deductionsAmount ?? $invoice->DeductionsAmount ?? 0),
                    'thirdPartyAmount' => floatval($invoice->thirdPartyAmount ?? $invoice->ThirdPartyAmount ?? 0),
                    'discountAmount' => floatval($invoice->discountAmount ?? $invoice->DiscountAmount ?? 0),
                    'currency' => (string)($invoice->currency ?? $invoice->Currency ?? 'EUR'),
                    'exchangeRate' => floatval($invoice->exchangeRate ?? $invoice->ExchangeRate ?? 1),
                    'lineItems' => []
                ];

                // Parse line items if present
                $lineItems = $invoice->lineItems ?? $invoice->LineItems ?? null;
                if ($lineItems) {
                    foreach ($lineItems->lineItem ?? $lineItems->LineItem ?? [] as $lineItem) {
                        $docData['lineItems'][] = [
                            'lineNumber' => intval($lineItem->lineNumber ?? $lineItem->LineNumber ?? 0),
                            'description' => (string)($lineItem->description ?? $lineItem->Description ?? ''),
                            'quantity' => floatval($lineItem->quantity ?? $lineItem->Quantity ?? 0),
                            'unitOfMeasurement' => (string)($lineItem->unitOfMeasurement ?? $lineItem->UnitOfMeasurement ?? ''),
                            'unitPrice' => floatval($lineItem->unitPrice ?? $lineItem->UnitPrice ?? 0),
                            'netAmount' => floatval($lineItem->netAmount ?? $lineItem->NetAmount ?? 0),
                            'vatCategory' => (string)($lineItem->vatCategory ?? $lineItem->VatCategory ?? ''),
                            'vatAmount' => floatval($lineItem->vatAmount ?? $lineItem->VatAmount ?? 0),
                            'grossAmount' => floatval($lineItem->grossAmount ?? $lineItem->GrossAmount ?? 0),
                            'discountOption' => (string)($lineItem->discountOption ?? $lineItem->DiscountOption ?? ''),
                            'discountAmount' => floatval($lineItem->discountAmount ?? $lineItem->DiscountAmount ?? 0),
                        ];
                    }
                }

                $docsList[] = $docData;
            }

            Log::info('Parsed documents successfully', ['count' => count($docsList)]);
            return $docsList;

        } catch (\Exception $e) {
            Log::error('Transmitted docs XML parsing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [];
        }
    }

    /**
     * Find matching invoice by tax ID, date, and amount
     */
    private function findMatchingInvoice(string $taxId, string $issueDate, float $grossValue, int $userId): ?Invoice
    {
        // Clean tax ID - remove spaces, dashes, special characters
        $cleanTaxId = preg_replace('/[^0-9]/', '', $taxId);

        // Find business entity by tax ID for this user - check both with and without cleaning
        $businessEntity = BusinessEntity::where('user_id', $userId)
            ->where(function ($query) use ($taxId, $cleanTaxId) {
                $query->where('tax_id', $taxId)
                    ->orWhere('tax_id', $cleanTaxId)
                    ->orWhere(DB::raw("REPLACE(REPLACE(REPLACE(tax_id, ' ', ''), '-', ''), '.', '')"), $cleanTaxId);
            })
            ->first();

        if (!$businessEntity) {
            return null;
        }

        // Find invoice matching the business entity, date, and gross value
        // Allow small floating point differences (up to 0.01€)
        // Use DATE() to compare only the date part, ignoring time component
        return Invoice::where('user_id', $userId)
            ->where('business_entity_id', $businessEntity->id)
            ->whereRaw("DATE(issue_date) = ?", [$issueDate])
            ->whereBetween('total_gross', [$grossValue - 0.01, $grossValue + 0.01])
            ->first();
    }
}
