<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->value());
        }

        $users = $query->get();

        return $this->successResponse([
            'users' => UserResource::collection($users)->resolve(),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
            'role' => $request->validated('role'),
            'avatar_style' => $request->validated('avatar_style'),
            'avatar_seed' => $request->validated('avatar_seed'),
        ]);

        return $this->successResponse([
            'user' => (new UserResource($user))->resolve(),
        ], 'User created successfully.', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = [
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'role' => $request->validated('role'),
        ];

        if ($request->filled('avatar_style')) {
            $data['avatar_style'] = $request->validated('avatar_style');
        }

        if ($request->filled('avatar_seed')) {
            $data['avatar_seed'] = $request->validated('avatar_seed');
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->validated('password'));
        }

        $user->update($data);

        return $this->successResponse([
            'user' => (new UserResource($user->fresh()))->resolve(),
        ], 'User updated successfully.');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return $this->errorResponse('You cannot delete your own account.', status: 403);
        }

        $user->delete();

        return $this->successResponse(null, 'User deleted successfully.');
    }
}
