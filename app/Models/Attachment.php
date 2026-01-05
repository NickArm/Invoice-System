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
    ];

    protected $casts = [
        'extracted_data' => 'array',
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
