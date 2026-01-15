<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailersend' => [
        'api_key' => env('MAILERSEND_API_KEY'),
        'host' => env('MAILERSEND_HOST', 'api.mailersend.com'),
    ],

    'llamaindex' => [
        'api_key' => env('LLAMAINDEX_API_KEY'),
        'agent_id' => env('LLAMAINDEX_AGENT_ID'),
    ],

];
