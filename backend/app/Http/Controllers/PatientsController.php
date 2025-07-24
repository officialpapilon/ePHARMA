<?php

namespace App\Http\Controllers;

use App\Models\Patients;
use Illuminate\Http\Request;

class PatientsController extends Controller
{
    public function index()
    {
        $patients = Patients::all();
        return response()->json($patients);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|unique:patients,phone',
            'address' => 'nullable|string',
            'age' => 'nullable|integer',
            'email' => 'nullable|string',
            'gender' => 'nullable|string',
            'status' => 'nullable|string',
            'created_by' => 'nullable|string',
            'updated_by' => 'nullable|string',
        ]);

        $patient = Patients::create($validatedData);
        return response()->json($patient, 201);
    }

    public function show($id)
    {
        $patient = Patients::findOrFail($id);
        return response()->json($patient);
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);

        $validatedData = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|unique:patients,phone,' . $patient->id,
            'address' => 'nullable|string',
            'age' => 'nullable|integer',
            'email' => 'sometimes|required|string|email|unique:patients,email,' . $patient->id,
            'gender' => 'nullable|string',
            'status' => 'nullable|string',
            'created_by' => 'nullable|string',
            'updated_by' => 'nullable|string',
        ]);

        $patient->update($validatedData);
        return response()->json($patient);
    }

    public function destroy($id)
    {
        $patient = Patients::findOrFail($id);
        $patient->delete();
        return response()->json(null, 204);
    }
}