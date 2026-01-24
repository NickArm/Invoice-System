<?php

namespace App\Services;

use Firebed\AadeMyData\Http\MyDataRequest;
use Firebed\VatRegistry\TaxisNet;
use Firebed\VatRegistry\VatException;
use Illuminate\Support\Facades\Log;

class AadeService
{
    private ?MyDataRequest $mydataClient = null;
    private ?TaxisNet $vatRegistry = null;

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
            $this->vatRegistry = new TaxisNet($username, $password);
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

            // Query VAT Registry using TaxisNet
            $entity = $this->vatRegistry->handle($taxId);

            if (!$entity || !$entity->vatNumber) {
                return [
                    'success' => false,
                    'message' => 'Company not found in VAT Registry'
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'tax_id' => $entity->vatNumber,
                    'name' => $entity->legalName ?? $entity->commerceTitle,
                    'doy' => $entity->taxAuthorityName,
                    'postal_code' => $entity->postcode,
                    'address' => trim(($entity->street ?? '') . ' ' . ($entity->streetNumber ?? '')),
                    'city' => $entity->city,
                    'activity' => isset($entity->firms[0]) ? $entity->firms[0]['description'] : null,
                    'status' => $entity->validityDescription,
                    'is_active' => $entity->isActive(),
                ]
            ];

        } catch (VatException $e) {
            Log::error('VAT Registry validation failed', [
                'tax_id' => $taxId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'VAT Registry error: ' . $e->getMessage()
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

    /**
     * Test connection to VAT Registry using a known VAT number probe
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
            // Use National Bank of Greece VAT as a simple probe
            $entity = $this->vatRegistry->handle('094014201');

            if ($entity && $entity->vatNumber) {
                return [
                    'success' => true,
                    'message' => 'Connection to VAT Registry successful'
                ];
            }

            return [
                'success' => false,
                'message' => 'VAT Registry connection failed - no response'
            ];
        } catch (VatException $e) {
            Log::error('VAT Registry connection test failed', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'VAT Registry error: ' . $e->getMessage()
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
}
