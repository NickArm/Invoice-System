<?php

namespace App\Http\Controllers;

use App\Mail\AccountantReportMail;
use App\Models\Attachment;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;

class AccountantReportController extends Controller
{
    public function send(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
            'type' => 'required|in:all,income,expense',
        ]);

        $user = $request->user();
        $recipients = collect($user->accountant_emails ?? [])->filter()->values();

        if ($recipients->isEmpty()) {
            return back()->withErrors(['emails' => 'Προσθέστε τουλάχιστον ένα email λογιστή στις Ρυθμίσεις.'])->withInput();
        }

        $from = Carbon::parse($validated['date_from'])->startOfDay();
        $to = Carbon::parse($validated['date_to'])->endOfDay();

        if ($from->gt($to)) {
            return back()->withErrors(['date_to' => 'Η τελική ημερομηνία πρέπει να είναι μετά την αρχική.'])->withInput();
        }

        $invoices = Invoice::with('businessEntity')
            ->byUser($user->id)
            ->byDateRange($from, $to)
            ->byType($validated['type'])
            ->orderBy('issue_date')
            ->get();

        if ($invoices->isEmpty()) {
            return back()->withErrors(['date_from' => 'Δεν βρέθηκαν τιμολόγια στο επιλεγμένο διάστημα.'])->withInput();
        }

        $income = $invoices->where('type', 'income');
        $expense = $invoices->where('type', 'expense');

        $summary = [
            'total_count' => $invoices->count(),
            'income_count' => $income->count(),
            'expense_count' => $expense->count(),
            'income_sum' => (float) $income->sum('total_gross'),
            'expense_sum' => (float) $expense->sum('total_gross'),
            'net' => (float) ($income->sum('total_gross') - $expense->sum('total_gross')),
        ];

        $invoiceMap = $invoices->keyBy('id');
        $invoiceIds = $invoiceMap->keys();

        $attachments = Attachment::where('user_id', $user->id)
            ->whereIn('invoice_id', $invoiceIds)
            ->get();

        $zipPath = null;
        $zipName = null;
        $attachedFiles = 0;

        if ($attachments->isNotEmpty()) {
            $zipName = 'invoices-' . $from->format('Ymd') . '-' . $to->format('Ymd') . '.zip';
            $relativeZipPath = 'accountant_exports/' . $user->id . '/' . $zipName;
            Storage::disk('local')->makeDirectory('accountant_exports/' . $user->id);
            $fullZipPath = Storage::disk('local')->path($relativeZipPath);

            $zip = new ZipArchive();
            if ($zip->open($fullZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                foreach ($attachments as $attachment) {
                    if (!$attachment->path) {
                        continue;
                    }

                    $fullPath = Storage::disk('local')->path($attachment->path);
                    if (!is_file($fullPath)) {
                        continue;
                    }

                    $invoice = $invoiceMap->get($attachment->invoice_id);
                    $labelNumber = $invoice?->number ?: 'invoice-' . $invoice?->id;
                    $safeInvoice = preg_replace('/[^A-Za-z0-9._-]/', '_', $labelNumber);
                    $safeOriginal = preg_replace('/[^A-Za-z0-9._-]/', '_', $attachment->original_name ?: basename($attachment->path));
                    $safeName = ($safeInvoice ?: 'invoice') . '-' . $safeOriginal;

                    $zip->addFile($fullPath, $safeName);
                    $attachedFiles++;
                }
                $zip->close();

                if ($attachedFiles > 0) {
                    $zipPath = $relativeZipPath;
                } else {
                    Storage::disk('local')->delete($relativeZipPath);
                }
            }
        }

        Mail::to($recipients)->send(new AccountantReportMail(
            user: $user,
            summary: $summary,
            invoices: $invoices,
            dateFrom: $from,
            dateTo: $to,
            type: $validated['type'],
            zipPath: $zipPath,
            zipName: $zipName,
            attachmentsCount: $attachedFiles,
            userMessage: $user->accountant_message ?? '',
        ));

        if ($zipPath) {
            Storage::disk('local')->delete($zipPath);
        }

        return back()->with('success', 'Το email στάλθηκε στον λογιστή με επιτυχία.');
    }
}
