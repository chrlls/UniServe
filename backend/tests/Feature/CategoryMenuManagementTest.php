<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryMenuManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_categories(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/categories', [
            'name' => 'Soups',
            'description' => 'Warm bowls for rainy days.',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.category.name', 'Soups');

        $categoryId = $createResponse->json('data.category.id');

        $updateResponse = $this->patchJson("/api/categories/{$categoryId}", [
            'description' => 'Warm bowls and noodle soups.',
        ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.category.description', 'Warm bowls and noodle soups.');

        $listResponse = $this->getJson('/api/categories');

        $listResponse
            ->assertOk()
            ->assertJsonCount(1, 'data.categories');

        $deleteResponse = $this->deleteJson("/api/categories/{$categoryId}");

        $deleteResponse
            ->assertOk()
            ->assertJsonPath('message', 'Category deleted successfully.');
    }

    public function test_admin_can_manage_menu_items_and_toggle_availability(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        Sanctum::actingAs($admin);

        $createResponse = $this->post('/api/menu-items', [
            'category_id' => $category->id,
            'name' => 'Iced Matcha Latte',
            'description' => 'Fresh matcha with chilled milk.',
            'price' => 89.50,
            'stock_quantity' => 40,
            'low_stock_threshold' => 10,
            'image' => UploadedFile::fake()->image('matcha.jpg'),
        ], [
            'Accept' => 'application/json',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.menu_item.name', 'Iced Matcha Latte')
            ->assertJsonPath('data.menu_item.is_available', true);

        $menuItemId = $createResponse->json('data.menu_item.id');
        $storedPath = $createResponse->json('data.menu_item.image_path');

        Storage::disk('public')->assertExists($storedPath);

        $toggleResponse = $this->patchJson("/api/menu-items/{$menuItemId}/availability", [
            'is_available' => false,
        ]);

        $toggleResponse
            ->assertOk()
            ->assertJsonPath('data.menu_item.is_available', false);

        $listResponse = $this->getJson('/api/menu-items?is_available=0');

        $listResponse
            ->assertOk()
            ->assertJsonCount(1, 'data.menu_items');
    }
}
