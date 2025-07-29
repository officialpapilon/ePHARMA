<?php

// Test script to verify authentication and token functionality
// This script should be run from the backend directory

require_once 'vendor/autoload.php';

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

echo "Testing Authentication and Token Functionality...\n\n";

// Test 1: Check if User model has Sanctum traits
try {
    $user = new User();
    $reflection = new ReflectionClass($user);
    $traits = $reflection->getTraitNames();
    
    if (in_array('Laravel\Sanctum\HasApiTokens', $traits)) {
        echo "✓ User model has HasApiTokens trait\n";
    } else {
        echo "✗ User model missing HasApiTokens trait\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking User model traits: " . $e->getMessage() . "\n";
}

// Test 2: Check if there are any users in the database
try {
    $userCount = User::count();
    echo "✓ Found {$userCount} users in database\n";
    
    if ($userCount > 0) {
        $user = User::first();
        echo "✓ Sample user: {$user->username} (ID: {$user->id})\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking users: " . $e->getMessage() . "\n";
}

// Test 3: Check if there are any active tokens
try {
    $tokenCount = PersonalAccessToken::count();
    echo "✓ Found {$tokenCount} personal access tokens\n";
    
    if ($tokenCount > 0) {
        $token = PersonalAccessToken::first();
        echo "✓ Sample token: {$token->name} (ID: {$token->id})\n";
        echo "  - Tokenable type: {$token->tokenable_type}\n";
        echo "  - Tokenable ID: {$token->tokenable_id}\n";
        echo "  - Expires at: " . ($token->expires_at ? $token->expires_at->format('Y-m-d H:i:s') : 'Never') . "\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking tokens: " . $e->getMessage() . "\n";
}

// Test 4: Check Sanctum configuration
try {
    $config = config('sanctum');
    echo "✓ Sanctum configuration loaded\n";
    echo "  - Stateful domains: " . implode(', ', $config['stateful']) . "\n";
    echo "  - Guards: " . implode(', ', $config['guard']) . "\n";
    echo "  - Expiration: " . ($config['expiration'] ? $config['expiration'] . ' minutes' : 'Never') . "\n";
} catch (Exception $e) {
    echo "✗ Error checking Sanctum config: " . $e->getMessage() . "\n";
}

// Test 5: Check auth configuration
try {
    $authConfig = config('auth');
    echo "✓ Auth configuration loaded\n";
    echo "  - Default guard: {$authConfig['defaults']['guard']}\n";
    echo "  - Available guards: " . implode(', ', array_keys($authConfig['guards'])) . "\n";
} catch (Exception $e) {
    echo "✗ Error checking auth config: " . $e->getMessage() . "\n";
}

echo "\nTest completed!\n"; 