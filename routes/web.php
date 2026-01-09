<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AccountantReportController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Models\Attachment;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'active', 'throttle:60,1'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile/purge-data', [ProfileController::class, 'purgeData'])->name('profile.purge-data');

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/business-details', [SettingsController::class, 'businessDetails'])->name('business-details');
        Route::post('/business-details', [SettingsController::class, 'updateBusinessDetails'])->name('business-details.update');

        Route::get('/accountant-emails', [SettingsController::class, 'accountantEmails'])->name('accountant-emails');
        Route::post('/accountant-emails', [SettingsController::class, 'updateAccountantEmails'])->name('accountant-emails.update');

        Route::get('/imap', [SettingsController::class, 'imapSettings'])->name('imap');
        Route::post('/imap', [SettingsController::class, 'updateImapSettings'])->name('imap.update');
        Route::post('/imap/test', [SettingsController::class, 'testImapConnection'])->name('imap.test');

        Route::get('/aade', [SettingsController::class, 'aadeSettings'])->name('aade');
        Route::post('/aade', [SettingsController::class, 'updateAadeSettings'])->name('aade.update');
        Route::post('/aade/validate-tax-id', [SettingsController::class, 'validateTaxId'])->name('aade.validate-tax-id');
        Route::post('/aade/test-connection', [SettingsController::class, 'testAadeConnection'])->name('aade.test-connection');

        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    });

    Route::post('/accountant/send', [AccountantReportController::class, 'send'])->name('accountant.send');

    // Invoices (RESTful resource)
    Route::resource('invoices', InvoiceController::class)->except(['show']);
    Route::get('/invoices/extract/{attachment}', [InvoiceController::class, 'extract'])->name('invoices.extract');

    // Business Entities (RESTful resource)
    Route::resource('business-entities', \App\Http\Controllers\BusinessEntityController::class);

    Route::get('/attachments/{attachment}/preview', function (Attachment $attachment) {
        if ($attachment->user_id !== auth()->id()) abort(403);
        return response()->file(Storage::disk('local')->path($attachment->path));
    })->name('attachments.preview');

    // File upload + AI extraction trigger (stricter limit)
    Route::post('/upload', [UploadController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('upload.store');

    // Admin Panel - User Management (admin only)
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', UserController::class)->except(['show']);
        Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    });
});

require __DIR__.'/auth.php';
