<?php

namespace App\Services;

use App\Models\InventoryLog;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private readonly InventoryService $inventoryService)
    {
    }

    public function createOrder(User $actor, array $validated): Order
    {
        return DB::transaction(function () use ($actor, $validated): Order {
            $items = collect($validated['items']);
            $menuItems = MenuItem::query()
                ->whereIn('id', $items->pluck('menu_item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $orderItems = $items->map(function (array $item) use ($menuItems): array {
                /** @var MenuItem|null $menuItem */
                $menuItem = $menuItems->get($item['menu_item_id']);

                if ($menuItem === null) {
                    throw ValidationException::withMessages([
                        'items' => ['One or more selected menu items could not be found.'],
                    ]);
                }

                if (! $menuItem->is_available) {
                    throw ValidationException::withMessages([
                        'items' => [$menuItem->name.' is currently unavailable.'],
                    ]);
                }

                if ($menuItem->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ['Insufficient stock for '.$menuItem->name.'.'],
                    ]);
                }

                return [
                    'menu_item' => $menuItem,
                    'quantity' => (int) $item['quantity'],
                    'unit_price' => (float) $menuItem->price,
                    'line_total' => round(((float) $menuItem->price) * (int) $item['quantity'], 2),
                ];
            });

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'customer_id' => $actor->role === User::ROLE_CUSTOMER ? $actor->id : ($validated['customer_id'] ?? null),
                'cashier_id' => in_array($actor->role, [User::ROLE_ADMIN, User::ROLE_CASHIER], true) ? $actor->id : null,
                'total_amount' => $orderItems->sum('line_total'),
                'payment_method' => $validated['payment_method'],
                'status' => Order::STATUS_PENDING,
                'ordered_at' => Carbon::now(),
            ]);

            $orderItems->each(function (array $item) use ($order, $actor): void {
                /** @var MenuItem $menuItem */
                $menuItem = $item['menu_item'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['line_total'],
                ]);

                $this->inventoryService->changeStock(
                    $menuItem,
                    -$item['quantity'],
                    InventoryLog::TYPE_DEDUCT,
                    $actor,
                    'Stock deducted for order '.$order->order_number,
                );
            });

            return $order->load(['items.menuItem.category', 'customer', 'cashier']);
        });
    }

    public function updateStatus(Order $order, string $status): Order
    {
        if (! $this->isValidTransition($order->status, $status)) {
            throw ValidationException::withMessages([
                'status' => ['Invalid order status transition.'],
            ]);
        }

        $order->update([
            'status' => $status,
        ]);

        return $order->load(['items.menuItem.category', 'customer', 'cashier']);
    }

    private function isValidTransition(string $currentStatus, string $nextStatus): bool
    {
        if ($currentStatus === $nextStatus) {
            return true;
        }

        if (in_array($currentStatus, [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED], true)) {
            return false;
        }

        $transitions = [
            Order::STATUS_PENDING => [Order::STATUS_PREPARING, Order::STATUS_CANCELLED],
            Order::STATUS_PREPARING => [Order::STATUS_READY, Order::STATUS_CANCELLED],
            Order::STATUS_READY => [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED],
        ];

        return in_array($nextStatus, $transitions[$currentStatus] ?? [], true);
    }

    private function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'ORD-'.$date.'-';

        $latestOrderNumber = Order::query()
            ->whereDate('ordered_at', now()->toDateString())
            ->lockForUpdate()
            ->latest('id')
            ->value('order_number');

        $sequence = 1;

        if ($latestOrderNumber !== null && str_starts_with($latestOrderNumber, $prefix)) {
            $sequence = ((int) substr($latestOrderNumber, -4)) + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
