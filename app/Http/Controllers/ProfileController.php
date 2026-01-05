<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Attachment;
use App\Models\BusinessEntity;
use App\Models\Invoice;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Delete all user data (invoices, entities, files) but keep the account.
     */
    public function purgeData(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        DB::transaction(function () use ($user) {
            // Get all attachments to delete their physical files
            $attachments = Attachment::where('user_id', $user->id)->get();

            foreach ($attachments as $attachment) {
                // Delete physical file from storage
                if ($attachment->path && Storage::disk('local')->exists($attachment->path)) {
                    Storage::disk('local')->delete($attachment->path);
                }
            }

            // Delete all attachments records
            Attachment::where('user_id', $user->id)->delete();

            // Delete all invoices (cascade will handle invoice_items)
            Invoice::where('user_id', $user->id)->delete();

            // Delete all business entities
            BusinessEntity::where('user_id', $user->id)->delete();
        });

        return Redirect::route('profile.edit')->with('status', 'data-deleted');
    }
}
