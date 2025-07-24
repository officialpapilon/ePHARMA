<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{
 
    public function subscribe(Request $request, User $user)
    {
        if (Auth::user()->position !== 'Manager') {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'type' => 'required|in:quarterly,yearly',
        ]);

        $duration = $validated['type'] === 'yearly' ? 365 : 90;

        $subscription = Subscription::updateOrCreate(
            ['user_id' => $user->id],
            [
                'type' => $validated['type'],
                'start_date' => now(),
                'end_date' => now()->addDays($duration),
                'is_active' => true
            ]
        );

        return response()->json($subscription);
    }

    public function checkSubscription(User $user)
    {
        if (!$user->subscription || !$user->subscription->isActive()) {
            return response()->json(['has_active_subscription' => false]);
        }

        return response()->json([
            'has_active_subscription' => true,
            'subscription' => $user->subscription
        ]);
    }
}