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

    // Query Scopes
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeByType($query, string $type)
    {
        if (in_array($type, ['income', 'expense'])) {
            return $query->where('type', $type);
        }
        return $query;
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('issue_date', [$startDate, $endDate]);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeApprovedOnly($query)
    {
        return $query->where('status', '!=', 'draft');
    }

    public function scopeBySearchTerm($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('number', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereHas('businessEntity', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('tax_id', 'like', "%{$search}%");
                });
        });
    }

    public function scopeByAmount($query, $minAmount, $maxAmount)
    {
        if (!empty($minAmount)) {
            $query->where('total_gross', '>=', $minAmount);
        }
        if (!empty($maxAmount)) {
            $query->where('total_gross', '<=', $maxAmount);
        }
        return $query;
    }
}
