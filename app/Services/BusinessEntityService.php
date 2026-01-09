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
                return $entity;
            }
        }

        // Create new entity
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
            'type' => $data['supplier_type'] ?? null,
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
