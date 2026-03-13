<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkRestockRequest;
use App\Http\Requests\UpdateInventoryStockRequest;
use App\Http\Resources\InventoryLogResource;
use App\Http\Resources\MenuItemResource;
use App\Models\InventoryLog;
use App\Models\MenuItem;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::query()->with('category')->latest();

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        $menuItems = $query->get();
        $recentLogs = InventoryLog::query()
            ->with(['menuItem.category', 'changedBy'])
            ->latest()
            ->limit(20)
            ->get();

        return $this->successResponse([
            'inventory_items' => MenuItemResource::collection($menuItems)->resolve(),
            'recent_logs' => InventoryLogResource::collection($recentLogs)->resolve(),
        ]);
    }

    public function updateStock(UpdateInventoryStockRequest $request, MenuItem $menuItem): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $log = $this->inventoryService->setStock(
            $menuItem,
            $request->integer('stock_quantity'),
            $user,
            $request->string('reason')->trim()->value(),
        );

        $log->load(['menuItem.category', 'changedBy']);
        $menuItem->refresh()->load('category');

        return $this->successResponse([
            'menu_item' => (new MenuItemResource($menuItem))->resolve(),
            'inventory_log' => (new InventoryLogResource($log))->resolve(),
        ], 'Inventory updated successfully.');
    }

    public function bulkRestock(BulkRestockRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $logs = $this->inventoryService->bulkRestock(
            $request->validated('items'),
            $user,
            $request->validated('reason'),
        );

        $logs->load(['menuItem.category', 'changedBy']);

        return $this->successResponse([
            'inventory_logs' => InventoryLogResource::collection($logs)->resolve(),
        ], 'Inventory restocked successfully.');
    }
}

