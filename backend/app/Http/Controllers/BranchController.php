<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Pharmacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BranchController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Pharmacy $pharmacy)
    {
        $this->authorize('viewAny', [Branch::class, $pharmacy]);

        return $pharmacy->branches;
    }

    public function store(Request $request, Pharmacy $pharmacy)
    {
        $this->authorize('create', [Branch::class, $pharmacy]);

        $validated = $request->validate([
            'name' => 'required|string',
            'address' => 'required|string',
            'contact_phone' => 'required|string',
        ]);

        $branch = $pharmacy->branches()->create([
            'name' => $validated['name'],
            'address' => $validated['address'],
            'contact_phone' => $validated['contact_phone'],
            'is_active' => false
        ]);

        return response()->json($branch, 201); 
    }

    public function show(Branch $branch)
    {
        $this->authorize('view', $branch);
        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch)
    {
        $this->authorize('update', $branch);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'address' => 'sometimes|string',
            'contact_phone' => 'sometimes|string',
            'is_active' => 'sometimes|boolean'
        ]);

        $branch->update($validated);

        return response()->json($branch);
    }

    public function destroy(Branch $branch)
    {
        $this->authorize('delete', $branch);
        $branch->delete();
        return response()->json(null, 204);
    }

    public function activate(Branch $branch)
    {
        $this->authorize('activate', $branch);
        $branch->activate();
        return response()->json(['message' => 'Branch activated successfully']);
    }

    public function deactivate(Branch $branch)
    {
        $this->authorize('deactivate', $branch);
        $branch->deactivate();
        return response()->json(['message' => 'Branch deactivated successfully']);
    }
}