<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_middleware_blocks_access_for_the_wrong_role(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
        ]);

        $response = $this->actingAs($user)->getJson('/api/reports/sales-summary');

        $response
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You do not have permission to access this resource.')
            ->assertJsonPath('errors.role.0', 'This action is unauthorized for your role.');
    }

    public function test_role_middleware_allows_access_for_an_allowed_role(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        $response = $this->actingAs($user)->getJson('/api/reports/sales-summary');

        $response
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
