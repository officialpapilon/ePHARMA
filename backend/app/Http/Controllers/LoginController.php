<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Branch;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        Log::info('Login attempt started', ['username' => $request->username]);

        try {
            $validatedData = $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
                'branch_id' => 'required|integer|exists:branches,id',
            ], [
                'username.required' => 'The username field is required.',
                'password.required' => 'The password field is required.',
                'branch_id.required' => 'Please select a branch.',
                'branch_id.integer' => 'The branch ID must be an integer.',
                'branch_id.exists' => 'The selected branch does not exist.',
            ]);

            $user = User::where('username', $request->username)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid username or password'], 401);
            }

            if (!$this->belongsToActiveBranch($user, $request->branch_id)) {
                return response()->json([
                    'message' => 'You are not associated with this branch or the branch is inactive',
                ], 403);
            }

            $user->tokens()->delete();
            
            $token = $user->createToken('auth_token', ['*'], now()->addHours(8))->plainTextToken;
            
            $branch = Branch::find($request->branch_id);

            $deviceFingerprint = $this->createDeviceFingerprint($request);

            $user->update([
                'last_login_device' => $deviceFingerprint,
                'last_login_at' => now(),
                'last_login_ip' => $this->getClientIp($request),
            ]);

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user_id' => $user->id,
                'branch_id' => $request->branch_id,
                'branch_name' => $branch->name ?? null,
                // Enhanced user details for frontend
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'position' => $user->position,
                    'phone_number' => $user->phone_number,
                    'address' => $user->address,
                    'belonged_branches' => $user->getBelongedBranchesArray(),
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'last_login_at' => $user->last_login_at,
                    'last_login_ip' => $user->last_login_ip,
                    'last_login_device' => $user->last_login_device,
                ],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Login error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An error occurred during login',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Request password reset
     */
    public function forgotPassword(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'username' => 'required|string',
                'phone_number' => 'required|string',
            ], [
                'username.required' => 'Username is required.',
                'phone_number.required' => 'Phone number is required.',
            ]);

            // Find user by username and phone number
            $user = User::where('username', $request->username)
                       ->where('phone_number', $request->phone_number)
                       ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'No user found with the provided username and phone number.'
                ], 404);
            }

            // Generate reset token
            $resetToken = Str::random(64);
            $expiresAt = now()->addMinutes(30); // Token expires in 30 minutes

            // Store reset token in database
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => $resetToken,
                    'created_at' => now(),
                    'expires_at' => $expiresAt,
                ]
            );

            // In a real application, you would send SMS here
            // For now, we'll return the token for testing
            return response()->json([
                'message' => 'Password reset verification code sent to your phone number.',
                'reset_token' => $resetToken, // Remove this in production
                'expires_at' => $expiresAt,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Forgot password error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An error occurred while processing your request.'
            ], 500);
        }
    }

    /**
     * Verify reset token and reset password
     */
    public function resetPassword(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'reset_token' => 'required|string',
                'new_password' => 'required|string|min:8',
                'confirm_password' => 'required|same:new_password',
            ], [
                'reset_token.required' => 'Reset token is required.',
                'new_password.required' => 'New password is required.',
                'new_password.min' => 'Password must be at least 8 characters.',
                'confirm_password.required' => 'Password confirmation is required.',
                'confirm_password.same' => 'Password confirmation does not match.',
            ]);

            // Find the reset token
            $resetRecord = DB::table('password_reset_tokens')
                ->where('token', $request->reset_token)
                ->where('expires_at', '>', now())
                ->first();

            if (!$resetRecord) {
                return response()->json([
                    'message' => 'Invalid or expired reset token.'
                ], 400);
            }

            // Find user by email
            $user = User::where('email', $resetRecord->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.'
                ], 404);
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            // Delete all user tokens to force re-login
            $user->tokens()->delete();

            // Delete the reset token
            DB::table('password_reset_tokens')
                ->where('token', $request->reset_token)
                ->delete();

            return response()->json([
                'message' => 'Password reset successfully. Please login with your new password.'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Reset password error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An error occurred while resetting your password.'
            ], 500);
        }
    }

    /**
     * Verify reset token (for frontend validation)
     */
    public function verifyResetToken(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'reset_token' => 'required|string',
            ]);

            $resetRecord = DB::table('password_reset_tokens')
                ->where('token', $request->reset_token)
                ->where('expires_at', '>', now())
                ->first();

            if (!$resetRecord) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Invalid or expired reset token.'
                ], 400);
            }

            return response()->json([
                'valid' => true,
                'message' => 'Reset token is valid.',
                'expires_at' => $resetRecord->expires_at,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Verify reset token error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An error occurred while verifying the reset token.'
            ], 500);
        }
    }

    protected function belongsToActiveBranch(User $user, int $branchId): bool
    {
        $branches = $user->getBelongedBranchesArray();
        
        if (!in_array($branchId, $branches, true)) {
            return false;
        }

        return Branch::where('id', $branchId)
            ->where('is_active', true)
            ->exists();
    }

   
    protected function createDeviceFingerprint(Request $request): string
    {
        return sha1(
            $request->ip() .
            $request->header('User-Agent') .
            $request->header('Accept-Language')
        );
    }


    protected function getClientIp(Request $request)
{
    foreach (['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'] as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $request->ip(); 
}
    
    public function checkDevice(Request $request)
    {
        $currentFingerprint = $this->createDeviceFingerprint($request);
        
        if ($request->user()->last_login_device !== $currentFingerprint) {
            $request->user()->tokens()->delete();
            return response()->json(['message' => 'Device mismatch - please login again'], 401);
        }
        
        return response()->json(['message' => 'Device verified']);
    }

    public function me(Request $request)
{
    $user = $request->user();

    return response()->json([
        'user' => [
            'id' => $user->id,
            'full_name' => $user->full_name ?? null,
            'email' => $user->email ?? null,
            'branch_ids' => $user->getBelongedBranchesArray() ?? [],
            'last_login_at' => $user->last_login_at,
            'last_login_ip' => $user->last_login_ip,
        ],
    ]);
}

}