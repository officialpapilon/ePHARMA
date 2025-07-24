<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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

}
