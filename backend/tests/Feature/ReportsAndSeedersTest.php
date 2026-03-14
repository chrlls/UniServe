<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportsAndSeedersTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_sales_reports_for_a_date_range(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create(['name' => 'Meals']);
        $menuItem = MenuItem::factory()->for($category)->create(['name' => 'Chicken Meal', 'price' => 100]);

        $firstOrder = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'total_amount' => 200,
            'ordered_at' => Carbon::parse('2026-03-01 10:00:00'),
        ]);

        OrderItem::factory()->create([
            'order_id' => $firstOrder->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => 2,
            'unit_price' => 100,
            'line_total' => 200,
        ]);

        $secondOrder = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'total_amount' => 100,
            'ordered_at' => Carbon::parse('2026-03-02 11:00:00'),
        ]);

        OrderItem::factory()->create([
            'order_id' => $secondOrder->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => 1,
            'unit_price' => 100,
            'line_total' => 100,
        ]);

        Sanctum::actingAs($admin);

        $summaryResponse = $this->getJson('/api/reports/sales-summary?start_date=2026-03-01&end_date=2026-03-02');
        $itemsResponse = $this->getJson('/api/reports/best-selling-items?start_date=2026-03-01&end_date=2026-03-02');
        $trendsResponse = $this->getJson('/api/reports/order-trends?start_date=2026-03-01&end_date=2026-03-02');
        $categoriesResponse = $this->getJson('/api/reports/category-breakdown?start_date=2026-03-01&end_date=2026-03-02');

        $summaryResponse
            ->assertOk()
            ->assertJsonPath('data.summary.total_revenue', 300)
            ->assertJsonPath('data.summary.total_orders', 2)
            ->assertJsonPath('data.summary.average_order_value', 150);

        $itemsResponse
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Chicken Meal')
            ->assertJsonPath('data.items.0.quantity_sold', 3);

        $trendsResponse
            ->assertOk()
            ->assertJsonPath('data.trends.0.order_count', 1)
            ->assertJsonPath('data.trends.1.order_count', 1);

        $categoriesResponse
            ->assertOk()
            ->assertJsonPath('data.categories.0.category', 'Meals')
            ->assertJsonPath('data.categories.0.revenue', 300);
    }

    public function test_database_seeder_creates_required_minimum_records(): void
    {
        $this->seed();

        $this->assertGreaterThanOrEqual(5, Category::query()->count());
        $this->assertGreaterThanOrEqual(30, MenuItem::query()->count());
        $this->assertGreaterThanOrEqual(200, Order::query()->count());
        $this->assertDatabaseHas('users', ['email' => env('SUPER_ADMIN_EMAIL', 'admin@canteen.test')]);
        $this->assertDatabaseHas('users', ['email' => 'cashier@canteen.test']);
        $this->assertDatabaseHas('users', ['email' => 'customer@canteen.test']);
    }
}
