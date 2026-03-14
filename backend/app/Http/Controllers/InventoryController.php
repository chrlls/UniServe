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
        $query = MenuItem::query()->with('category');

        $search = trim((string) $request->query('search', ''));
        $categoryId = $request->integer('category_id');
        $status = (string) $request->query('status', 'all');
        $sort = (string) $request->query('sort', 'updated-desc');
        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(5, min($perPage, 50));

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search): void {
                        $categoryQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($categoryId > 0) {
            $query->where('category_id', $categoryId);
        }

        switch ($status) {
            case 'low-stock':
                $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
                break;
            case 'out-of-stock':
                $query->where('stock_quantity', 0);
                break;
            case 'healthy':
                $query->whereColumn('stock_quantity', '>', 'low_stock_threshold');
                break;
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        switch ($sort) {
            case 'name-asc':
                $query->orderBy('name')->orderBy('menu_items.id');
                break;
            case 'name-desc':
                $query->orderByDesc('name')->orderByDesc('menu_items.id');
                break;
            case 'stock-asc':
                $query->orderBy('stock_quantity')->orderBy('name')->orderBy('menu_items.id');
                break;
            case 'stock-desc':
                $query->orderByDesc('stock_quantity')->orderBy('name')->orderByDesc('menu_items.id');
                break;
            case 'category-asc':
                $query
                    ->leftJoin('categories', 'categories.id', '=', 'menu_items.category_id')
                    ->select('menu_items.*')
                    ->orderBy('categories.name')
                    ->orderBy('menu_items.name')
                    ->orderBy('menu_items.id');
                break;
            case 'updated-asc':
                $query->oldest('updated_at')->orderBy('menu_items.id');
                break;
            case 'low-stock-first':
                $query
                    ->orderByRaw('CASE WHEN stock_quantity <= low_stock_threshold THEN 0 ELSE 1 END')
                    ->orderBy('stock_quantity')
                    ->orderBy('name')
                    ->orderBy('menu_items.id');
                break;
            case 'updated-desc':
            default:
                $query->latest('updated_at')->orderByDesc('menu_items.id');
                break;
        }

        $menuItems = $query->paginate($perPage)->appends($request->query());
        $recentLogs = InventoryLog::query()
            ->with(['menuItem.category', 'changedBy'])
            ->latest()
            ->limit(20)
            ->get();

        return $this->successResponse([
            'inventory_items' => MenuItemResource::collection($menuItems->getCollection())->resolve(),
            'inventory_pagination' => [
                'current_page' => $menuItems->currentPage(),
                'last_page' => $menuItems->lastPage(),
                'per_page' => $menuItems->perPage(),
                'total' => $menuItems->total(),
                'from' => $menuItems->firstItem(),
                'to' => $menuItems->lastItem(),
            ],
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

