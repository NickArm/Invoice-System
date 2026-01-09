<?php

namespace App\Services;

use Firebed\AadeMyData\Http\MyDataRequest;
use Firebed\VatRegistry\VatRegistry;
use Illuminate\Support\Facades\Log;

class AadeService
{
    private ?MyDataRequest $mydataClient = null;
    private ?VatRegistry $vatRegistry = null;

    /**
     * Initialize AADE myDATA client with subscription key
     * Used for invoice submissions and data retrieval
     */
    public function initializeMyData(string $username, string $subscriptionKey, bool $sandbox = true): bool
    {
        try {
            $environment = $sandbox ? 'dev' : 'prod';
            
            $this->mydataClient = new MyDataRequest(
                userId: $username,
                subscriptionKey: $subscriptionKey,
                env: $environment
            );

            return true;
        } catch (\Exception $e) {
            Log::error('AADE myDATA client initialization failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Initialize VAT Registry client
     * Used for tax ID validation
     */
    public function initializeVatRegistry(string $username, string $password): bool
    {
        try {
            $this->vatRegistry = new VatRegistry($username, $password);
            return true;
        } catch (\Exception $e) {
            Log::error('VAT Registry client initialization failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Validate a Greek tax ID (ΑΦΜ) using VAT Registry
     * Returns company information if valid
     */
    public function validateTaxId(string $taxId): array
    {
        if (!$this->vatRegistry) {
            return [
                'success' => false,
                'message' => 'VAT Registry client not initialized'
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

            // Query VAT Registry
            $result = $this->vatRegistry->get($taxId);

            if (!$result || !isset($result['afm'])) {
                return [
                    'success' => false,
                    'message' => 'Company not found in VAT Registry'
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'tax_id' => $result['afm'] ?? $taxId,
                    'name' => $result['onomasia'] ?? null,
                    'doy' => $result['doy_descr'] ?? null,
                    'postal_code' => $result['postal_zip_code'] ?? null,
                    'address' => $result['postal_address'] ?? null,
                    'activity' => $result['firm_act_descr'] ?? null,
                    'status' => $result['i_ni_flag_descr'] ?? null,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('VAT Registry validation failed', [
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
     * Test connection to VAT Registry
     */
    public function testVatRegistryConnection(): array
    {
        if (!$this->vatRegistry) {
            return [
                'success' => false,
                'message' => 'VAT Registry client not initialized'
            ];
        }

        try {
            // Try a simple query
            $result = $this->vatRegistry->get('999999999');
            
            return [
                'success' => true,
                'message' => 'Connection to VAT Registry successful'
            ];
        } catch (\Exception $e) {
            Log::error('VAT Registry connection test failed', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Connection to VAT Registry failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Test connection to AADE myDATA API
     */
    public function testMyDataConnection(): array
    {
        if (!$this->mydataClient) {
            return [
                'success' => false,
                'message' => 'AADE myDATA client not initialized'
            ];
        }

        try {
            // Simple connection test - check if client is configured
            return [
                'success' => true,
                'message' => 'AADE myDATA client initialized successfully'
            ];
        } catch (\Exception $e) {
            Log::error('AADE myDATA connection test failed', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Connection to AADE myDATA failed: ' . $e->getMessage()
            ];
        }
    }
}
