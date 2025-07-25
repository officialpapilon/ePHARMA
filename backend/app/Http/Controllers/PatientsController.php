<?php

namespace App\Http\Controllers;

use App\Models\Patients;
use Illuminate\Http\Request;

class PatientsController extends Controller
{
    public function index()
    {
        $patients = Patients::orderBy('first_name', 'asc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $patients,
            'message' => 'Patients retrieved successfully'
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'phone' => 'nullable|string|unique:patients,phone',
                'address' => 'nullable|string',
                'age' => 'nullable|integer|min:0|max:150',
                'email' => 'nullable|string|email|unique:patients,email',
                'gender' => 'nullable|string|in:Male,Female',
                'status' => 'nullable|string',
                'created_by' => 'nullable|string',
                'updated_by' => 'nullable|string',
            ]);

            $patient = Patients::create($validatedData);
            
            return response()->json([
                'success' => true,
                'data' => $patient,
                'message' => 'Patient created successfully'
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create patient',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $patient = Patients::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $patient,
                'message' => 'Patient retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $patient = Patients::findOrFail($id);

            $validatedData = $request->validate([
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'phone' => 'nullable|string|unique:patients,phone,' . $patient->id,
                'address' => 'nullable|string',
                'age' => 'nullable|integer|min:0|max:150',
                'email' => 'nullable|string|email|unique:patients,email,' . $patient->id,
                'gender' => 'nullable|string|in:Male,Female',
                'status' => 'nullable|string',
                'updated_by' => 'nullable|string',
            ]);

            $patient->update($validatedData);
            
            return response()->json([
                'success' => true,
                'data' => $patient,
                'message' => 'Patient updated successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update patient'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $patient = Patients::findOrFail($id);
            $patient->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Patient deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete patient'
            ], 500);
        }
    }
}