<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_receive_standard_response_envelope(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jamie Customer',
            'email' => 'jamie@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Registration successful.')
            ->assertJsonPath('data.user.email', 'jamie@example.com')
            ->assertJsonPath('data.user.role', User::ROLE_CUSTOMER)
            ->assertJsonPath('data.token_type', 'Bearer');
    }

    public function test_user_can_log_in_and_fetch_authenticated_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'cashier@example.com',
            'password' => 'password',
            'role' => User::ROLE_CASHIER,
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', User::ROLE_CASHIER)
            ->assertJsonPath('data.token_type', 'Bearer');

        $token = $loginResponse->json('data.token');

        $profileResponse = $this->withToken($token)->getJson('/api/auth/me');

        $profileResponse
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_invalid_login_returns_validation_style_error_envelope(): void
    {
        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'The provided credentials are incorrect.')
            ->assertJsonPath('errors.email.0', 'The provided credentials are incorrect.');
    }

    public function test_logout_clears_the_authenticated_session(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $logoutResponse = $this->withToken($token)->postJson('/api/auth/logout');

        $logoutResponse
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Logout successful.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
