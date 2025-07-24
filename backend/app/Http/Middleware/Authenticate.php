<?php

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

public function handle($request, Closure $next, ...$guards)
{
    $guard = $guards[0] ?? null;

    if ($request->is('api/*')) {
        if (!Auth::guard($guard)->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
    } else {
        if (!Auth::guard($guard)->check()) {
            return redirect()->route('/'); 
        }
    }

    return $next($request);
}

