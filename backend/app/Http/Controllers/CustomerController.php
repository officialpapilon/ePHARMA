<?php


namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    public function index()
    {
        return response()->json(Customer::all(), 200);
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Incoming request data: ', $request->all());
    
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'phone' => 'required|string|unique:customers,phone',
                'address' => 'nullable|string|max:255',
                'age' => 'nullable|integer',
            ]);
    
            $nextId = Customer::max('id') + 1;
            if ($nextId < 1000) {
                $nextId = 1000; 
            }
    
            $customer = Customer::create(array_merge($validatedData, ['id' => $nextId]));
            
            return response()->json($customer, 201);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->validator->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error storing customer: ' . $e->getMessage());
            return response()->json(['error' => 'Something went wrong', 'message' => $e->getMessage()], 500);
        }
    }
    
}
