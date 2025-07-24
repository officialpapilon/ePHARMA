<?php

namespace App\Http\Controllers;

use App\Models\Pharmacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PharmacyController extends Controller
{
 
    public function index()
    {
        return Auth::user()->pharmacies;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_number' => 'required|string|unique:pharmacies',
            'address' => 'required|string',
            'contact_phone' => 'required|string'
        ]);

        $pharmacy = Auth::user()->pharmacies()->create($validated);

        return response()->json($pharmacy, 201);
    }

    public function show(Pharmacy $pharmacy)
    {
        $this->authorize('view', $pharmacy);
        return $pharmacy;
    }

    public function update(Request $request, Pharmacy $pharmacy)
    {
        $this->authorize('update', $pharmacy);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'license_number' => 'sometimes|string|unique:pharmacies,license_number,'.$pharmacy->id,
            'address' => 'sometimes|string',
            'contact_phone' => 'sometimes|string',
            'is_active' => 'sometimes|boolean'
        ]);

        $pharmacy->update($validated);

        return response()->json($pharmacy);
    }

    public function destroy(Pharmacy $pharmacy)
    {
        $this->authorize('delete', $pharmacy);
        $pharmacy->delete();
        return response()->json(null, 204);
    }
}