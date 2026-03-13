<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => 'ORD-'.now()->format('Ymd').'-'.str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'customer_id' => User::factory()->customer(),
            'cashier_id' => null,
            'total_amount' => fake()->randomFloat(2, 5, 150),
            'payment_method' => fake()->randomElement(['cash', 'card']),
            'status' => fake()->randomElement(Order::allowedStatuses()),
            'ordered_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
