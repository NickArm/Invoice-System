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
                Log::warning('myDATA API returned error', [
                    'http_code' => $httpCode,
                    'url' => $url,
                    'response' => $response,
                ]);

                return [
                    'success' => false,
                    'message' => "myDATA API returned status $httpCode",
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
