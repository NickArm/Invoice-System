<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = [
        'user_id',
        'invoice_id',
        'path',
        'mime_type',
        'size_bytes',
        'original_name',
        'source',
        'page_count',
        'status',
        'extracted_data',
        'needs_review',
    ];

    protected $casts = [
        'extracted_data' => 'array',
        'needs_review' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
