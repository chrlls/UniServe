<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryIndexQueryTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_index_returns_paginated_payload(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        MenuItem::factory()
            ->count(15)
            ->for($category)
            ->create();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/inventory?page=2&per_page=5');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(5, 'data.inventory_items')
            ->assertJsonPath('data.inventory_pagination.current_page', 2)
            ->assertJsonPath('data.inventory_pagination.per_page', 5)
            ->assertJsonPath('data.inventory_pagination.total', 15);
    }

    public function test_inventory_index_applies_status_and_sort_filters(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        MenuItem::factory()->for($category)->create([
            'name' => 'High Stock Item',
            'stock_quantity' => 30,
            'low_stock_threshold' => 10,
        ]);

        $firstLow = MenuItem::factory()->for($category)->create([
            'name' => 'First Low Item',
            'stock_quantity' => 2,
            'low_stock_threshold' => 5,
        ]);

        $secondLow = MenuItem::factory()->for($category)->create([
            'name' => 'Second Low Item',
            'stock_quantity' => 4,
            'low_stock_threshold' => 5,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/inventory?status=low-stock&sort=stock-asc');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.inventory_items')
            ->assertJsonPath('data.inventory_items.0.id', $firstLow->id)
            ->assertJsonPath('data.inventory_items.1.id', $secondLow->id);
    }

    public function test_inventory_index_supports_search_category_and_legacy_low_stock_param(): void
    {
        $admin = User::factory()->admin()->create();
        $beverages = Category::factory()->create(['name' => 'Beverages']);
        $desserts = Category::factory()->create(['name' => 'Desserts']);

        MenuItem::factory()->for($beverages)->create([
            'name' => 'Chocolate Milk',
            'stock_quantity' => 3,
            'low_stock_threshold' => 5,
        ]);

        MenuItem::factory()->for($desserts)->create([
            'name' => 'Chocolate Cupcake',
            'stock_quantity' => 20,
            'low_stock_threshold' => 5,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/inventory?search=Chocolate&category_id='.$beverages->id.'&low_stock_only=true');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.inventory_items')
            ->assertJsonPath('data.inventory_items.0.name', 'Chocolate Milk')
            ->assertJsonPath('data.inventory_items.0.is_low_stock', true);
    }
}
