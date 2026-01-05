<?php

namespace App\Http\Controllers;

use App\Models\Company;
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
}
