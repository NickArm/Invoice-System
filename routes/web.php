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

Route::middleware(['auth', 'active'])->group(function () {
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

        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    });

    Route::post('/accountant/send', [AccountantReportController::class, 'send'])->name('accountant.send');

    // Invoices
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::get('/invoices/extract/{attachment}', [InvoiceController::class, 'extract'])->name('invoices.extract');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
    Route::patch('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    // Business Entities
    Route::get('/business-entities', [\App\Http\Controllers\BusinessEntityController::class, 'index'])->name('business-entities.index');
    Route::get('/business-entities/create', [\App\Http\Controllers\BusinessEntityController::class, 'create'])->name('business-entities.create');
    Route::get('/business-entities/{entity}/edit', [\App\Http\Controllers\BusinessEntityController::class, 'edit'])->name('business-entities.edit');
    Route::post('/business-entities', [\App\Http\Controllers\BusinessEntityController::class, 'store'])->name('business-entities.store');
    Route::patch('/business-entities/{entity}', [\App\Http\Controllers\BusinessEntityController::class, 'update'])->name('business-entities.update');
    Route::delete('/business-entities/{entity}', [\App\Http\Controllers\BusinessEntityController::class, 'destroy'])->name('business-entities.destroy');

    Route::get('/attachments/{attachment}/preview', function (Attachment $attachment) {
        if ($attachment->user_id !== auth()->id()) abort(403);
        return response()->file(Storage::disk('local')->path($attachment->path));
    })->name('attachments.preview');

    // File upload + AI extraction trigger
    Route::post('/upload', [UploadController::class, 'store'])->name('upload.store');

    // Admin Panel - User Management (admin only)
    Route::middleware(['auth', 'active', 'admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__.'/auth.php';
