<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorBusinessEntityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:255|unique:business_entities,tax_id,' . ($this->businessEntity->id ?? 'NULL'),
            'tax_office' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'country' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'type' => 'required|in:customer,supplier',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The business entity name is required.',
            'tax_id.unique' => 'This tax ID has already been registered.',
            'type.required' => 'Please select a business entity type.',
            'email.email' => 'Please provide a valid email address.',
        ];
    }
}
