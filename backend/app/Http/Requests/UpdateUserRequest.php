<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends ApiFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->route('user'))],
            'password' => ['nullable', 'string', Password::defaults()],
            'role' => ['required', 'string', 'in:' . implode(',', [User::ROLE_ADMIN, User::ROLE_CASHIER, User::ROLE_CUSTOMER])],
        ];
    }
}
