<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Collection;

class ReportService
{
    public function salesSummary(?string $startDate = null, ?string $endDate = null): array
    {
        [$start, $end] = $this->resolveRange($startDate, $endDate);
        $orders = $this->completedOrdersInRange($start, $end);

        $totalRevenue = (float) $orders->sum('total_amount');
        $totalOrders = $orders->count();

        return [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'total_revenue' => round($totalRevenue, 2),
            'total_orders' => $totalOrders,
            'average_order_value' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0.0,
            'daily_revenue' => round($orders->where('ordered_at', '>=', now()->startOfDay())->sum('total_amount'), 2),
            'weekly_revenue' => round($orders->where('ordered_at', '>=', now()->startOfWeek())->sum('total_amount'), 2),
            'monthly_revenue' => round($orders->where('ordered_at', '>=', now()->startOfMonth())->sum('total_amount'), 2),
        ];
    }

    public function bestSellingItems(?string $startDate = null, ?string $endDate = null): array
    {
        [$start, $end] = $this->resolveRange($startDate, $endDate);
        $orders = $this->completedOrdersInRange($start, $end);
        $aggregated = [];

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $menuItem = $item->menuItem;

                if ($menuItem === null) {
                    continue;
                }

                $entry = $aggregated[$menuItem->id] ?? [
                    'menu_item_id' => $menuItem->id,
                    'name' => $menuItem->name,
                    'category' => $menuItem->category?->name,
                    'quantity_sold' => 0,
                    'revenue' => 0.0,
                ];

                $entry['quantity_sold'] += $item->quantity;
                $entry['revenue'] += (float) $item->line_total;
                $aggregated[$menuItem->id] = $entry;
            }
        }

        usort($aggregated, fn (array $left, array $right) => $right['quantity_sold'] <=> $left['quantity_sold']);

        return array_values(array_map(function (array $item): array {
            $item['revenue'] = round($item['revenue'], 2);

            return $item;
        }, array_slice($aggregated, 0, 10)));
    }

    public function orderTrends(?string $startDate = null, ?string $endDate = null): array
    {
        [$start, $end] = $this->resolveRange($startDate, $endDate);
        $orders = $this->completedOrdersInRange($start, $end);
        $grouped = $orders->groupBy(fn (Order $order) => $order->ordered_at->toDateString());
        $trend = [];

        foreach (CarbonPeriod::create($start, $end) as $date) {
            $dateKey = $date->toDateString();
            $dayOrders = $grouped->get($dateKey, collect());

            $trend[] = [
                'date' => $dateKey,
                'order_count' => $dayOrders->count(),
                'revenue' => round((float) $dayOrders->sum('total_amount'), 2),
            ];
        }

        return $trend;
    }

    public function categoryBreakdown(?string $startDate = null, ?string $endDate = null): array
    {
        [$start, $end] = $this->resolveRange($startDate, $endDate);
        $orders = $this->completedOrdersInRange($start, $end);
        $aggregated = [];
        $totalRevenue = 0.0;

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $category = $item->menuItem?->category;

                if ($category === null) {
                    continue;
                }

                $entry = $aggregated[$category->id] ?? [
                    'category_id' => $category->id,
                    'category' => $category->name,
                    'quantity_sold' => 0,
                    'revenue' => 0.0,
                ];

                $entry['quantity_sold'] += $item->quantity;
                $entry['revenue'] += (float) $item->line_total;
                $aggregated[$category->id] = $entry;
                $totalRevenue += (float) $item->line_total;
            }
        }

        return array_values(array_map(function (array $item) use ($totalRevenue): array {
            $item['revenue'] = round($item['revenue'], 2);
            $item['percentage'] = $totalRevenue > 0 ? round(($item['revenue'] / $totalRevenue) * 100, 2) : 0.0;

            return $item;
        }, $aggregated));
    }

    private function completedOrdersInRange(Carbon $start, Carbon $end): Collection
    {
        return Order::query()
            ->with(['items.menuItem.category'])
            ->where('status', Order::STATUS_COMPLETED)
            ->whereBetween('ordered_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get();
    }

    private function resolveRange(?string $startDate, ?string $endDate): array
    {
        $end = $endDate !== null ? Carbon::parse($endDate) : now();
        $start = $startDate !== null ? Carbon::parse($startDate) : $end->copy()->subDays(29);

        if ($start->greaterThan($end)) {
            [$start, $end] = [$end, $start];
        }

        return [$start->startOfDay(), $end->endOfDay()];
    }
}
