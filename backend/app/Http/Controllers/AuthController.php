<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->string('name')->trim()->value(),
            'email' => $request->string('email')->lower()->value(),
            'password' => $request->string('password')->value(),
            'role' => User::ROLE_CUSTOMER,
        ]);

        $data = $this->buildAuthenticatedUserPayload($request, $user, true);

        return $this->successResponse(
            $data,
            'Registration successful.',
            201,
        );
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->safe()->only(['email', 'password']);
        $remember = $request->boolean('remember');
        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return $this->errorResponse(
                "Too many login attempts. Please try again in {$seconds} seconds.",
                ['email' => ['Too many login attempts.']],
                429,
            );
        }

        if (! Auth::attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, 60);

            return $this->errorResponse(
                'The provided credentials are incorrect.',
                ['email' => ['The provided credentials are incorrect.']],
                422,
            );
        }

        RateLimiter::clear($throttleKey);

        $user = $request->user() ?? Auth::user();

        return $this->successResponse(
            $this->buildAuthenticatedUserPayload($request, $user),
            'Login successful.',
        );
    }

    public function logout(Request $request): JsonResponse
    {
        if ($request->user()?->currentAccessToken() !== null) {
            $request->user()->currentAccessToken()->delete();
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->successResponse(
            data: null,
            message: 'Logout successful.',
        );
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'user' => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = [
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
        ];

        if ($request->filled('avatar_style')) {
            $data['avatar_style'] = $request->validated('avatar_style');
        }

        if ($request->filled('avatar_seed')) {
            $data['avatar_seed'] = $request->validated('avatar_seed');
        }

        $user->update($data);

        return $this->successResponse([
            'user' => new UserResource($user->fresh()),
        ], 'Profile updated successfully.');
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $request->user()->update([
            'password' => $request->validated('password'),
        ]);

        return $this->successResponse(null, 'Password updated successfully.');
    }

    private function buildAuthenticatedUserPayload(Request $request, User $user, bool $loginSession = false): array
    {
        $payload = [
            'user' => new UserResource($user),
        ];

        if ($loginSession) {
            Auth::login($user);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();

            return $payload;
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            ...$payload,
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    private function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->string('email')->value()).'|'.$request->ip());
    }
}
