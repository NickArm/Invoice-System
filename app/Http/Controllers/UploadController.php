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
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $user = auth()->user();
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
