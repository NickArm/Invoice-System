<?php

namespace App\Http\Controllers;

use App\Services\AadeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ToolsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $company = $user->company;
        $bankAccounts = $company ? $company->bankAccounts()->get() : collect([]);
        $accountantEmails = collect($user->accountant_emails ?? [])->filter()->values();

        return Inertia::render('Tools/Index', [
            'bankAccounts' => $bankAccounts,
            'accountantEmails' => $accountantEmails,
            'mydataCredentials' => [
                'username' => $user->aade_username,
                'subscriptionKey' => $user->mydata_subscription_key,
            ],
        ]);
    }

    /**
     * Validate Greek tax ID via VAT Registry (using stored credentials from settings)
     */
    public function validateTaxId(Request $request)
    {
        $validated = $request->validate([
            'tax_id' => 'required|string|max:20',
        ]);

        $user = auth()->user();

        // Get stored credentials from settings
        if (!$user->vat_registry_username || !$user->vat_registry_password) {
            return response()->json([
                'success' => false,
                'message' => 'VAT Registry credentials not configured. Please set them in Settings → AADE Integration.'
            ], 422);
        }

        $aadeService = new AadeService();

        // Initialize VAT Registry with stored credentials
        if (!$aadeService->initializeVatRegistry(
            $user->vat_registry_username,
            $user->vat_registry_password
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize VAT Registry client'
            ], 422);
        }

        // Validate the tax ID
        $result = $aadeService->validateTaxId($validated['tax_id']);

        return response()->json($result);
    }
}
