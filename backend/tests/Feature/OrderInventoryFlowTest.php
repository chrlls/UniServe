<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderInventoryFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_an_order_and_stock_is_deducted(): void
    {
        $customer = User::factory()->customer()->create();
        $category = Category::factory()->create();
        $menuItem = MenuItem::factory()->for($category)->create([
            'stock_quantity' => 10,
            'price' => 75.50,
        ]);

        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/orders', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => 2,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.order.total_amount', 151);

        $this->assertDatabaseHas('orders', [
            'customer_id' => $customer->id,
            'status' => Order::STATUS_PENDING,
        ]);

        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItem->id,
            'stock_quantity' => 8,
        ]);

        $this->assertDatabaseHas('inventory_logs', [
            'menu_item_id' => $menuItem->id,
            'change_type' => InventoryLog::TYPE_DEDUCT,
            'quantity_change' => -2,
        ]);
    }

    public function test_order_creation_fails_when_stock_is_insufficient(): void
    {
        $customer = User::factory()->customer()->create();
        $menuItem = MenuItem::factory()->create([
            'stock_quantity' => 1,
        ]);

        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/orders', [
            'payment_method' => 'card',
            'items' => [
                [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => 3,
                ],
            ],
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.items.0', 'Insufficient stock for '.$menuItem->name.'.');
    }

    public function test_cashier_can_adjust_inventory_and_bulk_restock(): void
    {
        $cashier = User::factory()->cashier()->create();
        $menuItem = MenuItem::factory()->create([
            'stock_quantity' => 5,
        ]);
        $secondItem = MenuItem::factory()->create([
            'stock_quantity' => 7,
        ]);

        Sanctum::actingAs($cashier);

        $adjustResponse = $this->patchJson("/api/inventory/{$menuItem->id}/stock", [
            'stock_quantity' => 12,
            'reason' => 'Morning stock count correction.',
        ]);

        $adjustResponse
            ->assertOk()
            ->assertJsonPath('data.menu_item.stock_quantity', 12)
            ->assertJsonPath('data.inventory_log.change_type', InventoryLog::TYPE_ADJUSTMENT);

        $bulkResponse = $this->postJson('/api/inventory/restock', [
            'reason' => 'Supplier delivery.',
            'items' => [
                [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => 3,
                ],
                [
                    'menu_item_id' => $secondItem->id,
                    'quantity' => 5,
                ],
            ],
        ]);

        $bulkResponse
            ->assertOk()
            ->assertJsonCount(2, 'data.inventory_logs');

        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItem->id,
            'stock_quantity' => 15,
        ]);

        $this->assertDatabaseHas('menu_items', [
            'id' => $secondItem->id,
            'stock_quantity' => 12,
        ]);
    }

    public function test_cancelling_an_active_order_restores_stock_and_logs_it(): void
    {
        $cashier = User::factory()->cashier()->create();
        $menuItem = MenuItem::factory()->create([
            'stock_quantity' => 10,
            'price' => 45,
        ]);

        $order = Order::factory()->create([
            'cashier_id' => $cashier->id,
            'customer_id' => null,
            'status' => Order::STATUS_PENDING,
            'total_amount' => 90,
        ]);

        $order->items()->create([
            'menu_item_id' => $menuItem->id,
            'quantity' => 2,
            'unit_price' => 45,
            'line_total' => 90,
        ]);

        $menuItem->update(['stock_quantity' => 8]);

        InventoryLog::create([
            'menu_item_id' => $menuItem->id,
            'changed_by' => $cashier->id,
            'change_type' => InventoryLog::TYPE_DEDUCT,
            'quantity_before' => 10,
            'quantity_change' => -2,
            'quantity_after' => 8,
            'reason' => 'Stock deducted for order '.$order->order_number,
        ]);

        Sanctum::actingAs($cashier);

        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => Order::STATUS_CANCELLED,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.order.status', Order::STATUS_CANCELLED);

        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItem->id,
            'stock_quantity' => 10,
        ]);

        $this->assertDatabaseHas('inventory_logs', [
            'menu_item_id' => $menuItem->id,
            'change_type' => InventoryLog::TYPE_RESTOCK,
            'quantity_change' => 2,
            'reason' => 'Stock restored for cancelled order '.$order->order_number,
        ]);
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $owner = User::factory()->customer()->create();
        $otherCustomer = User::factory()->customer()->create();
        $order = Order::factory()->create([
            'customer_id' => $owner->id,
            'status' => Order::STATUS_PENDING,
        ]);

        Sanctum::actingAs($otherCustomer);

        $response = $this->getJson("/api/orders/{$order->id}");

        $response
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You do not have permission to access this order.');
    }
}
