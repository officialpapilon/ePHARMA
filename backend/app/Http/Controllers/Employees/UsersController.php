<?php

namespace App\Http\Controllers\Employees;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsersController extends Controller
{
    /**
     * Display a listing of employees
     * Route: GET /api/employees
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search by name, email, or username
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        // Filter by position
        if ($request->has('position') && $request->position) {
            $query->where('position', $request->position);
        }

        // Filter by status (active/inactive)
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $employees = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $employees->items(),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'per_page' => $employees->perPage(),
                'total' => $employees->total(),
            ],
            'message' => 'Employees retrieved successfully'
        ]);
    }

    /**
     * Store a newly created employee
     * Route: POST /api/employees
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|unique:users,username|max:255',
            'password' => 'required|string|min:8',
            'position' => 'required|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'belonged_branches' => 'nullable|array',
            'belonged_branches.*' => 'integer|exists:branches,id',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'position' => $request->position,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'belonged_branches' => $request->belonged_branches ? json_encode($request->belonged_branches) : null,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Employee created successfully'
        ], 201);
    }

    /**
     * Display the specified employee
     * Route: GET /api/employees/{id}
     */
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Employee retrieved successfully'
        ]);
    }

    /**
     * Update the specified employee
     * Route: PUT /api/employees/{id}
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($id)],
            'username' => ['required', 'string', Rule::unique('users')->ignore($id), 'max:255'],
            'position' => 'required|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'belonged_branches' => 'nullable|array',
            'belonged_branches.*' => 'integer|exists:branches,id',
        ]);

        $user->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'username' => $request->username,
            'position' => $request->position,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'belonged_branches' => $request->belonged_branches ? json_encode($request->belonged_branches) : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Employee updated successfully'
        ]);
    }

    /**
     * Toggle employee active/inactive status
     * Route: POST /api/employees/{id}/toggle-status
     */
    public function toggleActive($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        // Prevent deactivating the last admin
        if ($user->position === 'Super Admin' && $user->status === 'active') {
            $adminCount = User::where('position', 'Super Admin')->where('status', 'active')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot deactivate the last Super Admin'
                ], 422);
            }
        }

        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Employee status updated successfully'
        ]);
    }

    /**
     * Get available positions for employees
     * Route: GET /api/employees/positions
     */
    public function getPositions()
    {
        $positions = [
            'Super Admin',
            'Admin',
            'Pharmacist',
            'Cashier',
            'Manager',
            'Assistant',
        ];

        return response()->json([
            'success' => true,
            'data' => $positions,
            'message' => 'Positions retrieved successfully'
        ]);
    }

    /**
     * Change password for the authenticated employee
     * Route: POST /api/employees/change-password
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

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }
} 