<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'accountant_emails',
        'accountant_emails_string',
        'accountant_message',
        'imap_host',
        'imap_port',
        'imap_username',
        'imap_password',
        'imap_ssl',
        'imap_subject_filter',
        'imap_subject_match_type',
        'imap_enabled',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'imap_password', // Hide IMAP password from serialization
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'accountant_emails' => 'array',
            'imap_ssl' => 'boolean',
            'imap_enabled' => 'boolean',
        ];
    }

    public function company()
    {
        return $this->hasOne(Company::class);
    }
}
