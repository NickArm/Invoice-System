<?php

namespace App\Services;

use Firebed\AadeMyData\Client;
use Firebed\AadeMyData\Models\Request;
use Firebed\AadeMyData\Models\CompanyInfo;
use Illuminate\Support\Facades\Log;

class AadeService
{
    private ?Client $client = null;

    /**
     * Initialize AADE client with user credentials
     */
    public function initialize(string $username, string $password, string $certificate): bool
    {
        try {
            // Create client with credentials
            $this->client = new Client(
                username: $username,
                password: $password,
                certificate: $certificate,
                sandbox: true // Use sandbox for testing
            );

            return true;
        } catch (\Exception $e) {
            Log::error('AADE Client initialization failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Validate a Greek tax ID (ΑΦΜ)
     * Returns company information if valid
     */
    public function validateTaxId(string $taxId): array
    {
        if (!$this->client) {
            return [
                'success' => false,
                'message' => 'AADE client not initialized'
            ];
        }

        try {
            // Clean tax ID - remove spaces and special characters
            $taxId = preg_replace('/\D/', '', $taxId);

            // Validate format (must be 9 digits)
            if (strlen($taxId) !== 9) {
                return [
                    'success' => false,
                    'message' => 'ΑΦΜ must be exactly 9 digits'
                ];
            }

            // Query company info from AADE
            $companyInfo = $this->client->getCompanyInfo($taxId);

            if (!$companyInfo) {
                return [
                    'success' => false,
                    'message' => 'Company not found in AADE database'
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'tax_id' => $taxId,
                    'name' => $companyInfo->getName(),
                    'status' => $companyInfo->getStatus(),
                    'activity' => $companyInfo->getMainActivity(),
                    'address' => $companyInfo->getAddress(),
                    'phone' => $companyInfo->getPhoneNumber(),
                ]
            ];

        } catch (\Exception $e) {
            Log::error('AADE tax ID validation failed', [
                'tax_id' => $taxId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to validate tax ID: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Test connection to AADE API
     */
    public function testConnection(): array
    {
        if (!$this->client) {
            return [
                'success' => false,
                'message' => 'AADE client not initialized'
            ];
        }

        try {
            // Try to validate a known test tax ID
            $result = $this->validateTaxId('000000000');
            
            return [
                'success' => true,
                'message' => 'Connection to AADE API successful'
            ];
        } catch (\Exception $e) {
            Log::error('AADE connection test failed', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Connection to AADE API failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if client is initialized
     */
    public function isInitialized(): bool
    {
        return $this->client !== null;
    }
}
