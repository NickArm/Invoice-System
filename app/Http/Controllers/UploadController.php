<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessInvoiceAttachment;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        // Log incoming request for debugging
        \Log::info('Upload request received', [
            'has_session' => $request->session() ? true : false,
            'user_id' => auth()->id(),
            'token_in_request' => $request->has('_token'),
            'headers' => [
                'X-CSRF-TOKEN' => $request->header('X-CSRF-TOKEN'),
                'X-XSRF-TOKEN' => $request->header('X-XSRF-TOKEN'),
            ]
        ]);

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $file = $request->file('file');

        // Store file locally under invoices/{user_id}/
        $path = $file->store("invoices/{$user->id}", 'local');

        // Create attachment record
        $attachment = Attachment::create([
            'user_id' => $user->id,
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'original_name' => $file->getClientOriginalName(),
            'source' => 'upload',
            'status' => 'uploaded',
        ]);

        // Dispatch ProcessInvoiceAttachment job
        ProcessInvoiceAttachment::dispatch($attachment);

        return response()->json([
            'success' => true,
            'attachment_id' => $attachment->id,
        ]);
    }
}
