<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends ApiFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()?->id),
            ],
            'avatar_style' => ['nullable', 'string', 'in:'.implode(',', User::AVATAR_STYLES)],
            'avatar_seed' => ['nullable', 'string', 'max:255'],
        ];
    }
}
