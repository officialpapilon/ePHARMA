<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class MigrateRecover extends Command
{
    protected $signature = 'migrate:recover {--force : Force the operation}';
    protected $description = 'Recover from failed migrations with better handling';

    public function handle()
    {
        if (! $this->confirmToProceed()) {
            return 1;
        }

        $this->info('Checking migration status...');
        
        $migrationFiles = collect(File::files(database_path('migrations')))
            ->map(fn ($file) => pathinfo($file, PATHINFO_FILENAME));

        $ranMigrations = DB::table('migrations')->pluck('migration');

        $orphaned = $ranMigrations->diff($migrationFiles);
        
        if ($orphaned->isNotEmpty()) {
            $this->warn('Found '.$orphaned->count().' orphaned migrations in database:');
            $this->table(['Orphaned Migrations'], $orphaned->map(fn ($m) => [$m]));
            
            if ($this->confirm('Remove orphaned migration records?')) {
                DB::table('migrations')->whereIn('migration', $orphaned)->delete();
                $this->info('Removed orphaned migration records.');
            }
        }

        $pending = $migrationFiles->diff($ranMigrations);
        
        if ($pending->isEmpty()) {
            $this->info('No pending migrations found.');
            return 0;
        }

        $this->info('Attempting to run '.$pending->count().' pending migrations...');
        
        try {
            Artisan::call('migrate', [
                '--force' => $this->option('force'),
            ]);
            $this->info(Artisan::output());
        } catch (\Exception $e) {
            $this->error('Migration error: '.$e->getMessage());
            $this->handleFailedMigrations($pending);
        }

        $this->info('Migration recovery completed.');
        return 0;
    }

    protected function handleFailedMigrations($pending)
    {
        $this->warn('Attempting individual migrations...');
        
        foreach ($pending as $migration) {
            try {
                $this->info("Running: $migration");
                Artisan::call('migrate', [
                    '--path' => 'database/migrations/'.$migration.'.php',
                    '--force' => $this->option('force'),
                ]);
                $this->info(Artisan::output());
            } catch (\Exception $e) {
                $this->error("Failed: $migration - ".$e->getMessage());
                
                if (str_contains($e->getMessage(), 'already exists')) {
                    $this->warn('Marking as run since table exists...');
                    DB::table('migrations')->insert([
                        'migration' => $migration,
                        'batch' => DB::table('migrations')->max('batch') + 1
                    ]);
                }
            }
        }
    }

    protected function confirmToProceed()
    {
        if (app()->environment('production') && ! $this->option('force')) {
            return $this->confirm('Application in production! Continue?');
        }
        return true;
    }
}