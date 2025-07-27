<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'single.session' => \App\Http\Middleware\CheckSingleSession::class,
            'cors' => \App\Http\Middleware\Cors::class,
            'auth' => \App\Http\Middleware\Authenticate::class,
        ]);
        
        // Apply CORS middleware globally
        $middleware->append(\App\Http\Middleware\Cors::class);
        
        $middleware->web(append: [
            \App\Http\Middleware\Cors::class,
        ]);
        
        $middleware->api(append: [
            \App\Http\Middleware\Cors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
