<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Models\Category;

class Invoice extends Model
{
    protected $fillable = [
        'user_id',
        'business_entity_id',
        'type',
        'status',
        'number',
        'issue_date',
        'due_date',
        'currency',
        'total_gross',
        'total_net',
        'vat_percent',
        'vat_amount',
        'description',
        'category_id',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'total_gross' => 'decimal:2',
        'total_net' => 'decimal:2',
        'vat_percent' => 'decimal:2',
        'vat_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function businessEntity(): BelongsTo
    {
        return $this->belongsTo(BusinessEntity::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function attachment(): HasOne
    {
        // Primary attachment - first one
        return $this->hasOne(Attachment::class)->oldestOfMany();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
