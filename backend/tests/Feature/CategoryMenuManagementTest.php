<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryLog;
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

        $deleteResponse = $this->deleteJson("/api/menu-items/{$menuItemId}");

        $deleteResponse
            ->assertOk()
            ->assertJsonPath('data.deleted', true)
            ->assertJsonPath('data.archived', false)
            ->assertJsonPath('message', 'Menu item deleted successfully.');

        $this->assertDatabaseMissing('menu_items', [
            'id' => $menuItemId,
        ]);

        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_admin_deleting_referenced_menu_item_hides_it_instead_of_deleting_it(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $menuItem = MenuItem::factory()->for($category)->create([
            'is_available' => true,
            'stock_quantity' => 18,
        ]);

        InventoryLog::create([
            'menu_item_id' => $menuItem->id,
            'changed_by' => $admin->id,
            'change_type' => InventoryLog::TYPE_ADJUSTMENT,
            'quantity_before' => 12,
            'quantity_change' => 6,
            'quantity_after' => 18,
            'reason' => 'Opening stock set for new menu item.',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/menu-items/{$menuItem->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.deleted', false)
            ->assertJsonPath('data.archived', true)
            ->assertJsonPath('data.menu_item.id', $menuItem->id)
            ->assertJsonPath('data.menu_item.is_available', false)
            ->assertJsonPath(
                'message',
                'Menu item has existing order or inventory history, so it was hidden instead of deleted.'
            );

        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItem->id,
            'is_available' => false,
        ]);
    }
}
