<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        if (! Auth::attempt($credentials, $remember)) {
            return $this->errorResponse(
                'The provided credentials are incorrect.',
                ['email' => ['The provided credentials are incorrect.']],
                422,
            );
        }

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
}

