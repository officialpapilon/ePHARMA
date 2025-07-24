<?php

namespace App\Http\Controllers;

use App\Models\PharmacySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PharmacySettingsController extends Controller
{
    protected $imageStoragePath = 'pharmacy_images'; 
    protected $imagePublicPath = 'storage/pharmacy_images'; 

    public function index()
    {
        $settings = PharmacySetting::getSettings();
        return response()->json($settings);
    }

    public function updateInfo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pharmacy_name' => 'required|string|max:100',
            'tin_number' => 'required|string|max:50',
            'phone_number' => 'required|string|max:20',
            'email' => 'required|email|max:100',
        ], [
            'pharmacy_name.required' => 'The pharmacy name is required',
            'tin_number.required' => 'The TIN number is required',
            'phone_number.required' => 'The phone number is required',
            'email.required' => 'The email address is required',
            'email.email' => 'Please enter a valid email address'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = PharmacySetting::getSettings();
        $settings->update($validator->validated());

        return response()->json([
            'message' => 'Pharmacy information updated successfully',
            'settings' => $settings
        ]);
    }

    public function uploadImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'type' => ['required', Rule::in(['logo', 'stamp'])]
        ], [
            'image.required' => 'Please select an image file',
            'image.image' => 'The file must be an image',
            'image.mimes' => 'Only JPEG, PNG, JPG, GIF, and SVG images are allowed',
            'image.max' => 'The image may not be greater than 2MB',
            'type.required' => 'Image type is required',
            'type.in' => 'Image type must be either logo or stamp'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = PharmacySetting::getSettings();
        $type = $request->type;
        $file = $request->file('image');
        
        $filename = $type . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        
        $path = $file->storeAs($this->imageStoragePath, $filename, 'public');
        
        $url = $this->imagePublicPath . '/' . $filename;

        if ($settings->{$type}) {
            $this->deleteImageFile($settings->{$type});
        }

        $settings->update([$type => $url]);

        return response()->json([
            'message' => ucfirst($type) . ' uploaded successfully',
            'url' => $url,
            'settings' => $settings
        ]);
    }

    public function removeImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => ['required', Rule::in(['logo', 'stamp'])]
        ], [
            'type.required' => 'Image type is required',
            'type.in' => 'Image type must be either logo or stamp'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = PharmacySetting::getSettings();
        $type = $request->type;

        if ($settings->{$type}) {
            $this->deleteImageFile($settings->{$type});
            $settings->update([$type => null]);
        }

        return response()->json([
            'message' => ucfirst($type) . ' removed successfully',
            'settings' => $settings
        ]);
    }

    protected function deleteImageFile($url)
    {
        if (!$url) return;
        
        $path = str_replace('storage/', '', $url);
        
        Storage::disk('public')->delete($path);
    }

    public function updateDepartments(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'departments' => 'required|array',
            'departments.*.id' => 'required|string',
            'departments.*.unit_code' => 'required|string|max:20',
            'departments.*.dept_name' => 'required|string|max:100',
            'departments.*.dept_description' => 'nullable|string',
            'departments.*.isActive' => 'required|boolean'
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        $settings = PharmacySetting::getSettings();
        
        $existingDepartments = $settings->departments ?? [];
        
        $existingDepartmentsMap = [];
        foreach ($existingDepartments as $dept) {
            $existingDepartmentsMap[$dept['id']] = $dept;
        }
        
        $updatedDepartments = [];
        foreach ($request->departments as $newDept) {
            if (isset($existingDepartmentsMap[$newDept['id']])) {
                $updatedDepartments[] = array_merge(
                    $existingDepartmentsMap[$newDept['id']],
                    $newDept
                );
            } else {
                $updatedDepartments[] = $newDept;
            }
        }
        
        $settings->update(['departments' => $updatedDepartments]);
    
        return response()->json([
            'message' => 'Departments updated successfully',
            'departments' => $settings->departments
        ]);
    }

    public function updatePaymentOptions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_options' => 'required|array',
            'payment_options.*.id' => 'required|string',
            'payment_options.*.name' => 'required|string|max:50',
            'payment_options.*.details' => 'nullable|array',
            'payment_options.*.isActive' => 'required|boolean'
        ], [
            'payment_options.required' => 'Payment options data is required',
            'payment_options.*.name.required' => 'Payment name is required for all options',
            'payment_options.*.isActive.required' => 'Active status is required for all payment options'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = PharmacySetting::getSettings();
        $settings->update(['payment_options' => $request->payment_options]);

        return response()->json([
            'message' => 'Payment options updated successfully',
            'payment_options' => $settings->payment_options
        ]);
    }

    public function updateDispensing(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mode' => ['required', Rule::in(['simple', 'complex'])],
            'dispense_by_dept' => 'required|boolean',
            'show_expired' => 'required|boolean',
            'show_prices' => 'required|boolean',
            'default_dept' => 'nullable|string'
        ], [
            'mode.required' => 'Dispensing mode is required',
            'mode.in' => 'Dispensing mode must be either simple or complex',
            'dispense_by_dept.required' => 'Department dispensing flag is required',
            'dispense_by_dept.boolean' => 'Department dispensing must be true or false',
            'show_expired.required' => 'Show expired medications flag is required',
            'show_expired.boolean' => 'Show expired medications must be true or false',
            'show_prices.required' => 'Show prices flag is required',
            'show_prices.boolean' => 'Show prices must be true or false',
            'default_dept.string' => 'Default department must be a string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = PharmacySetting::getSettings();
    
        $settings->mode = $request->mode;
        $settings->dispense_by_dept = $request->dispense_by_dept ? 'true' : 'false';
        $settings->show_expired = $request->show_expired ? 'true' : 'false';
        $settings->show_prices = $request->show_prices ? 'true' : 'false';
        $settings->default_dept = $request->default_dept;
        
        $settings->save();
    
        return response()->json([
            'message' => 'Dispensing settings updated successfully',
            'settings' => $settings
        ]);
    }

    public function resetToDefault()
    {
        $settings = PharmacySetting::getSettings();
        
        foreach (['logo', 'stamp'] as $type) {
            if ($settings->{$type}) {
                $this->deleteImageFile($settings->{$type});
            }
        }

        $settings->update([
            'logo' => null,
            'stamp' => null,
            'pharmacy_name' => '',
            'mode' => 'simple',
            'dispense_by_dept' => 'false',
            'show_expired' => 'false',
            'show_prices' => 'false',
            'default_dept' => null,
            'tin_number' => '',
            'phone_number' => '',
            'email' => '',
            'departments' => [],
            'payment_options' => []
        ]);

        return response()->json([
            'message' => 'Settings reset to default successfully',
            'settings' => $settings
        ]);
    }
}