<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::query()->where('role', User::ROLE_CUSTOMER)->get();
        $staff = User::query()->whereIn('role', [User::ROLE_ADMIN, User::ROLE_CASHIER])->get();
        $menuItems = MenuItem::query()->where('is_available', true)->get();

        if ($customers->isEmpty() || $staff->isEmpty() || $menuItems->count() < 5) {
            return;
        }

        /** @var OrderService $orderService */
        $orderService = app(OrderService::class);

        for ($index = 0; $index < 200; $index++) {
            $orderedAt = now()->subDays(fake()->numberBetween(0, 59))
                ->setTime(fake()->numberBetween(7, 18), fake()->numberBetween(0, 59));

            Carbon::setTestNow($orderedAt);

            $actor = fake()->boolean(60) ? $staff->random() : $customers->random();
            $selectedItems = $menuItems->random(fake()->numberBetween(1, 4));

            $payload = [
                'customer_id' => $actor->role === User::ROLE_CUSTOMER ? null : $customers->random()->id,
                'payment_method' => fake()->randomElement(['cash', 'card']),
                'items' => $selectedItems->map(fn (MenuItem $menuItem): array => [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => fake()->numberBetween(1, 3),
                ])->values()->all(),
            ];

            $order = $orderService->createOrder($actor, $payload);
            $finalStatus = fake()->randomElement([
                Order::STATUS_COMPLETED,
                Order::STATUS_COMPLETED,
                Order::STATUS_COMPLETED,
                Order::STATUS_READY,
                Order::STATUS_PREPARING,
                Order::STATUS_CANCELLED,
            ]);

            $this->advanceStatus($orderService, $order->fresh(), $finalStatus);
        }

        Carbon::setTestNow();
    }

    private function advanceStatus(OrderService $orderService, Order $order, string $targetStatus): void
    {
        $flow = match ($targetStatus) {
            Order::STATUS_PREPARING => [Order::STATUS_PREPARING],
            Order::STATUS_READY => [Order::STATUS_PREPARING, Order::STATUS_READY],
            Order::STATUS_COMPLETED => [Order::STATUS_PREPARING, Order::STATUS_READY, Order::STATUS_COMPLETED],
            Order::STATUS_CANCELLED => [Order::STATUS_CANCELLED],
            default => [],
        };

        foreach ($flow as $status) {
            $order = $orderService->updateStatus($order, $status);
        }
    }
}

