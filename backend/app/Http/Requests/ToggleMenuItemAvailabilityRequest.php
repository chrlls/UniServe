<?php

namespace App\Http\Requests;

class ToggleMenuItemAvailabilityRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'is_available' => ['required', 'boolean'],
        ];
    }
}
