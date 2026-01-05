<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\ImapService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function businessDetails()
    {
        $company = auth()->user()->company;

        return Inertia::render('Settings/BusinessDetails', [
            'company' => $company,
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
}
