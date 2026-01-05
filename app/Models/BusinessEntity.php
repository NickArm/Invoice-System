<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessEntity extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'tax_id',
        'tax_office',
        'email',
        'country',
        'city',
        'address',
        'postal_code',
        'phone',
        'mobile',
        'type',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
