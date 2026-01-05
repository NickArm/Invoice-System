<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        // Create company for admin user
        $admin = User::where('email', 'admin@example.com')->first();

        if ($admin && !$admin->company) {
            Company::create([
                'user_id' => $admin->id,
                'name' => "Nick Armenis's Business",
                'tax_id' => '135683276',
                'email' => 'armenisnick@gmail.com',
                'country' => 'GR',
                'city' => 'Corfu',
                'postal_code' => '49100',
                'tax_office' => 'Corfu',
                'address' => 'Ethnikis Paleokastrisas 68',
                'phone' => '6946994698',
            ]);
        }
    }
}
