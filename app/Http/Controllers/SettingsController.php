<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\BankAccount;
use App\Services\ImapService;
use App\Services\AadeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function businessDetails()
    {
        $company = auth()->user()->company;
        $bankAccounts = $company ? $company->bankAccounts()->get() : collect([]);

        return Inertia::render('Settings/BusinessDetails', [
            'company' => $company,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function updateBusinessDetails(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tax_id' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'country' => 'required|string|max:2',
            'city' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'tax_office' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ]);

        $company = auth()->user()->company;

        if (!$company) {
            $company = Company::create([
                'user_id' => auth()->id(),
                ...$validated,
            ]);
        } else {
            $company->update($validated);
        }

        return redirect()->route('settings.business-details')
            ->with('success', 'Business details updated successfully.');
    }

    public function accountantEmails()
    {
        $user = auth()->user();

        return Inertia::render('Settings/AccountantEmails', [
            'emails' => $user->accountant_emails_string ?? '',
            'message' => $user->accountant_message ?? '',
        ]);
    }

    public function updateAccountantEmails(Request $request)
    {
        $validated = $request->validate([
            'emails' => 'nullable|string|max:500',
            'message' => 'nullable|string|max:1000',
        ]);

        $emailsString = $validated['emails'] ?? '';
        $emailsArray = collect(explode(';', $emailsString))
            ->map(fn($e) => trim($e))
            ->filter(fn($e) => filter_var($e, FILTER_VALIDATE_EMAIL))
            ->unique()
            ->values()
            ->all();

        $message = $validated['message'] ?? '';
        $message = strip_tags($message);

        $user = auth()->user();
        $user->update([
            'accountant_emails_string' => $emailsString,
            'accountant_emails' => $emailsArray,
            'accountant_message' => $message,
        ]);

        return redirect()->route('settings.accountant-emails')
            ->with('success', 'Accountant settings updated.');
    }

    public function imapSettings()
    {
        $user = auth()->user();

        return Inertia::render('Settings/ImapSettings', [
            'settings' => [
                'imap_host' => $user->imap_host,
                'imap_port' => $user->imap_port ?? 993,
                'imap_username' => $user->imap_username,
                'imap_password_exists' => !empty($user->imap_password), // Add this flag
                'imap_ssl' => $user->imap_ssl ?? true,
                'imap_subject_filter' => $user->imap_subject_filter,
                'imap_subject_match_type' => $user->imap_subject_match_type ?? 'contains',
                'imap_enabled' => $user->imap_enabled ?? false,
            ],
        ]);
    }

    public function updateImapSettings(Request $request)
    {
        $validated = $request->validate([
            'imap_host' => 'nullable|string|max:255',
            'imap_port' => 'nullable|integer|min:1|max:65535',
            'imap_username' => 'nullable|string|max:255',
            'imap_password' => 'nullable|string|max:255',
            'imap_ssl' => 'boolean',
            'imap_subject_filter' => 'nullable|string|max:255',
            'imap_subject_match_type' => 'in:exact,contains',
            'imap_enabled' => 'boolean',
        ]);

        $user = auth()->user();

        // Only update password if provided
        if (empty($validated['imap_password'])) {
            unset($validated['imap_password']);
        }

        $user->update($validated);

        return redirect()->route('settings.imap')
            ->with('success', 'Email settings updated successfully.');
    }

    public function testImapConnection(Request $request, ImapService $imapService)
    {
        $validated = $request->validate([
            'imap_host' => 'required|string',
            'imap_port' => 'required|integer',
            'imap_username' => 'required|string',
            'imap_password' => 'required|string',
            'imap_ssl' => 'boolean',
        ]);

        // Create temporary user object for testing
        $testUser = auth()->user()->replicate();
        $testUser->fill($validated);

        $result = $imapService->testConnection($testUser);

        return response()->json($result);
    }

    public function aadeSettings()
    {
        $user = auth()->user();

        return Inertia::render('Settings/AadeSettings', [
            'settings' => [
                // VAT Registry (for tax ID validation)
                'vat_registry_username' => $user->vat_registry_username,
                'vat_registry_password' => $user->vat_registry_password,

                // AADE myDATA (for invoice submissions)
                'aade_username' => $user->aade_username,
                'mydata_subscription_key' => $user->mydata_subscription_key,
                'aade_enabled' => $user->aade_enabled ?? false,
            ],
        ]);
    }

    public function updateAadeSettings(Request $request)
    {
        $validated = $request->validate([
            // VAT Registry credentials
            'vat_registry_username' => 'nullable|string|max:255',
            'vat_registry_password' => 'nullable|string|max:255',

            // AADE myDATA credentials
            'aade_username' => 'nullable|string|max:255',
            'aade_password' => 'nullable|string|max:255',
            'mydata_subscription_key' => 'nullable|string|max:255',
            'aade_enabled' => 'boolean',
        ]);

        $user = auth()->user();

        // Only update passwords if provided
        if (empty($validated['aade_password'])) {
            unset($validated['aade_password']);
        }

        if (empty($validated['vat_registry_password'])) {
            unset($validated['vat_registry_password']);
        }

        $user->update($validated);

        return redirect()->route('settings.aade')
            ->with('success', 'AADE settings updated successfully.');
    }

    public function validateTaxId(Request $request)
    {
        $validated = $request->validate([
            'tax_id' => 'required|string|max:20',
            'vat_registry_username' => 'required|string|max:255',
            'vat_registry_password' => 'required|string|max:255',
        ]);

        $aadeService = new AadeService();

        // Initialize VAT Registry with provided credentials
        if (!$aadeService->initializeVatRegistry(
            $validated['vat_registry_username'],
            $validated['vat_registry_password']
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

    public function testAadeConnection(Request $request)
    {
        $validated = $request->validate([
            'aade_username' => 'nullable|string|max:255',
            'aade_password' => 'nullable|string|max:255',
            // VAT Registry test
            'vat_registry_username' => 'nullable|string|max:255',
            'vat_registry_password' => 'nullable|string|max:255',

            // myDATA test
            'mydata_subscription_key' => 'nullable|string|max:255',
        ]);

        $results = [];
        $aadeService = new AadeService();

        // Test VAT Registry if credentials provided
        if (!empty($validated['vat_registry_username']) && !empty($validated['vat_registry_password'])) {
            if ($aadeService->initializeVatRegistry(
                $validated['vat_registry_username'],
                $validated['vat_registry_password']
            )) {
                $results['vat_registry'] = $aadeService->testVatRegistryConnection();
            } else {
                $results['vat_registry'] = [
                    'success' => false,
                    'message' => 'Failed to initialize VAT Registry client'
                ];
            }
        }

        // Test myDATA if credentials provided
        if (!empty($validated['aade_username']) && !empty($validated['mydata_subscription_key'])) {
            if ($aadeService->initializeMyData(
                $validated['aade_username'],
                $validated['mydata_subscription_key'],
                true // sandbox
            )) {
                $results['mydata'] = $aadeService->testMyDataConnection();
            } else {
                $results['mydata'] = [
                    'success' => false,
                    'message' => 'Failed to initialize myDATA client'
                ];
            }
        }

        if (empty($results)) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide credentials to test'
            ], 422);
        }

        return response()->json([
            'success' => true,
            'results' => $results
        ]
        );
    }

    /**
     * Store a new bank account for the company
     */
    public function storeBankAccount(Request $request)
    {
        $company = auth()->user()->company;
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No company found. Please set up business details first.'
            ], 422);
        }

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'iban' => [
                'required',
                'string',
                'max:34',
                function ($attribute, $value, $fail) {
                    if (!$this->isValidIban($value)) {
                        $fail('The IBAN format is invalid. Please provide a valid IBAN.');
                    }
                },
            ],
            'swift_bic' => [
                'nullable',
                'string',
                'max:11',
                function ($attribute, $value, $fail) {
                    if ($value && !$this->isValidSwiftBic($value)) {
                        $fail('The SWIFT/BIC format is invalid. Expected 8 or 11 characters.');
                    }
                },
            ],
        ]);

        $bankAccount = BankAccount::create([
            'company_id' => $company->id,
            ...$validated,
        ]);

        return response()->json($bankAccount, 201);
    }

    /**
     * Update a bank account
     */
    public function updateBankAccount(Request $request, BankAccount $bankAccount)
    {
        if ($bankAccount->company->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'iban' => [
                'required',
                'string',
                'max:34',
                function ($attribute, $value, $fail) {
                    if (!$this->isValidIban($value)) {
                        $fail('The IBAN format is invalid. Please provide a valid IBAN.');
                    }
                },
            ],
            'swift_bic' => [
                'nullable',
                'string',
                'max:11',
                function ($attribute, $value, $fail) {
                    if ($value && !$this->isValidSwiftBic($value)) {
                        $fail('The SWIFT/BIC format is invalid. Expected 8 or 11 characters.');
                    }
                },
            ],
        ]);

        $bankAccount->update($validated);

        return response()->json($bankAccount, 200);
    }

    /**
     * Delete a bank account
     */
    public function deleteBankAccount(BankAccount $bankAccount)
    {
        if ($bankAccount->company->user_id !== auth()->id()) {
            abort(403);
        }

        $bankAccount->delete();

        return response()->json(['success' => true], 200);
    }

    /**
     * Validate IBAN format using mod-97 algorithm
     */
    private function isValidIban($iban)
    {
        // Remove spaces and convert to uppercase
        $iban = strtoupper(str_replace(' ', '', $iban));

        // Check length (should be 15-34 characters)
        if (strlen($iban) < 15 || strlen($iban) > 34) {
            return false;
        }

        // Check format: 2 letters, 2 digits, then alphanumeric
        if (!preg_match('/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/', $iban)) {
            return false;
        }

        // Move first 4 characters to end
        $rearranged = substr($iban, 4) . substr($iban, 0, 4);

        // Replace letters with numbers (A=10, B=11, ..., Z=35)
        $numeric = '';
        foreach (str_split($rearranged) as $char) {
            if (is_numeric($char)) {
                $numeric .= $char;
            } else {
                $numeric .= (ord($char) - ord('A') + 10);
            }
        }

        // Validate mod 97
        return bcmod($numeric, '97') === '1';
    }

    /**
     * Validate SWIFT/BIC format
     */
    private function isValidSwiftBic($bic)
    {
        // SWIFT/BIC should be 8 or 11 characters
        $bic = strtoupper(str_replace(' ', '', $bic));

        if (strlen($bic) !== 8 && strlen($bic) !== 11) {
            return false;
        }

        // Format: 4 letters (bank), 2 letters (country), 2 alphanumeric (location), optional 3 alphanumeric (branch)
        return preg_match('/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/', $bic);
    }
}
