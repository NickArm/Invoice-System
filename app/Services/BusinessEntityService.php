<?php

namespace App\Services;

use App\Models\BusinessEntity;
use Illuminate\Database\Eloquent\Model;

class BusinessEntityService
{
    /**
     * Find or create business entity based on supplier data
     */
    public function findOrCreate(int $userId, array $data): ?BusinessEntity
    {
        // If entity_id provided, use it directly
        if (!empty($data['entity_id'])) {
            return BusinessEntity::where('user_id', $userId)
                ->where('id', $data['entity_id'])
                ->firstOrFail();
        }

        // No supplier info provided
        if (empty($data['supplier_name']) && empty($data['supplier_tax_id'])) {
            return null;
        }

        // Try to find by tax_id
        if (!empty($data['supplier_tax_id'])) {
            $entity = BusinessEntity::where('user_id', $userId)
                ->where('tax_id', $data['supplier_tax_id'])
                ->first();

            if ($entity) {
                return $entity;
            }
        }

        // Try to find by name (case-insensitive)
        if (!empty($data['supplier_name'])) {
            $entity = BusinessEntity::where('user_id', $userId)
                ->whereRaw('LOWER(name) = ?', [strtolower($data['supplier_name'])])
                ->first();

            if ($entity) {
                // CRITICAL: Check if existing entity has different Tax ID
                $incomingTaxId = !empty($data['supplier_tax_id']) ? trim($data['supplier_tax_id']) : null;
                $existingTaxId = $entity->tax_id ? trim($entity->tax_id) : null;

                if ($incomingTaxId && $existingTaxId && $incomingTaxId !== $existingTaxId) {
                    \Log::warning('Duplicate company name with different Tax ID detected', [
                        'user_id' => $userId,
                        'company_name' => $data['supplier_name'],
                        'existing_tax_id' => $existingTaxId,
                        'incoming_tax_id' => $incomingTaxId,
                        'existing_entity_id' => $entity->id,
                    ]);

                    // Throw exception to alert user about conflict
                    throw new \Exception(
                        "ΠΡΟΣΟΧΗ: Βρέθηκε εταιρεία με το ίδιο όνομα αλλά διαφορετικό ΑΦΜ!\n\n" .
                        "Όνομα: {$data['supplier_name']}\n" .
                        "Υπάρχον ΑΦΜ: {$existingTaxId}\n" .
                        "Νέο ΑΦΜ: {$incomingTaxId}\n\n" .
                        "Παρακαλώ ελέγξτε το τιμολόγιο και διορθώστε το ΑΦΜ χειροκίνητα."
                    );
                }

                return $entity;
            }
        }

        // Check if Tax ID exists with different name (also suspicious)
        if (!empty($data['supplier_tax_id']) && !empty($data['supplier_name'])) {
            $entityByTaxId = BusinessEntity::where('user_id', $userId)
                ->where('tax_id', $data['supplier_tax_id'])
                ->first();

            if ($entityByTaxId) {
                $existingName = trim(strtolower($entityByTaxId->name));
                $incomingName = trim(strtolower($data['supplier_name']));

                if ($existingName !== $incomingName) {
                    \Log::warning('Same Tax ID with different company name detected', [
                        'user_id' => $userId,
                        'tax_id' => $data['supplier_tax_id'],
                        'existing_name' => $entityByTaxId->name,
                        'incoming_name' => $data['supplier_name'],
                    ]);

                    // Use existing entity but log warning
                    return $entityByTaxId;
                }
            }
        }

        // Create new entity
        // Determine entity type based on invoice type
        $entityType = 'supplier'; // Default to supplier
        if (!empty($data['supplier_type'])) {
            $entityType = $data['supplier_type'];
        } elseif (!empty($data['type'])) {
            // If invoice type is expense, entity is supplier; if income, entity is customer
            $entityType = $data['type'] === 'income' ? 'customer' : 'supplier';
        }

        return BusinessEntity::create([
            'user_id' => $userId,
            'name' => $data['supplier_name'] ?? 'Unknown Supplier',
            'tax_id' => $data['supplier_tax_id'] ?? null,
            'tax_office' => $data['supplier_tax_office'] ?? null,
            'email' => $data['supplier_email'] ?? null,
            'address' => $data['supplier_address'] ?? null,
            'city' => $data['supplier_city'] ?? null,
            'country' => $data['supplier_country'] ?? null,
            'postal_code' => $data['supplier_postal_code'] ?? null,
            'phone' => $data['supplier_phone'] ?? null,
            'mobile' => $data['supplier_mobile'] ?? null,
            'type' => $entityType,
        ]);
    }

    /**
     * Check if invoice is duplicate
     */
    public function isDuplicate(int $userId, string $invoiceNumber, ?int $entityId): bool
    {
        if (!$invoiceNumber || !$entityId) {
            return false;
        }

        return \App\Models\Invoice::where('user_id', $userId)
            ->where('number', $invoiceNumber)
            ->where('business_entity_id', $entityId)
            ->exists();
    }

    /**
     * Get duplicate error message
     */
    public function getDuplicateMessage(BusinessEntity $entity, string $invoiceNumber): string
    {
        return "Το τιμολόγιο με αριθμό {$invoiceNumber} από την εταιρεία {$entity->name} (ΑΦΜ: {$entity->tax_id}) υπάρχει ήδη καταχωρημένο.";
    }
}
