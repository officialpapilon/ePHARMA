<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function me(Request $request)
{
    $user = $request->user();

    return response()->json([
        'user' => [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'position' => $user->position,
            'branch_ids' => $user->getBelongedBranchesArray() ?? [],
            'last_login_at' => $user->last_login_at,
            'last_login_ip' => $user->last_login_ip,
        ],
    ]);
}

    /**
     * Change the authenticated user's password
     * Route: POST /api/user/change-password
     * Body: { old_password, new_password }
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Old password is incorrect.'
            ], 422);
        }

        $user->password = bcrypt($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }
}
