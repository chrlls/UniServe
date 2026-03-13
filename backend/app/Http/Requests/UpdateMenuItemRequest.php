<?php

namespace App\Http\Requests;

class UpdateMenuItemRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'is_available' => ['sometimes', 'boolean'],
            'image' => ['sometimes', 'nullable', 'image', 'max:2048'],
            'stock_quantity' => ['sometimes', 'required', 'integer', 'min:0'],
            'low_stock_threshold' => ['sometimes', 'required', 'integer', 'min:0'],
        ];
    }
}
