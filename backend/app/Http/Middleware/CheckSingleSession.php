<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class CheckSingleSession
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            $currentToken = $request->bearerToken();
            $token = PersonalAccessToken::findToken($currentToken);
            
            if (!$token || $token->id !== auth()->user()->tokens()->latest()->first()?->id) {
                auth()->user()->tokens()->delete();
                
                return response()->json([
                    'message' => 'Session expired - logged in elsewhere',
                    'redirect_to' => '/login', 
                    'session_ended' => true  
                ], 401);
            }
        }

        return $next($request);
    }
}