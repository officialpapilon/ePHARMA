<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateExistingUsersStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update all existing users to have 'active' status
        DB::table('users')->whereNull('status')->update(['status' => 'active']);
        
        $this->command->info('Updated existing users status to active');
    }
}
