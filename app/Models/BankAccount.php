<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankAccount extends Model
{
    protected $fillable = [
        'company_id',
        'bank_name',
        'iban',
        'swift_bic',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
