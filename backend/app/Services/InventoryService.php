<?php

namespace App\Services;

use App\Models\InventoryLog;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function changeStock(
        MenuItem $menuItem,
        int $quantityChange,
        string $changeType,
        ?User $user = null,
        ?string $reason = null,
    ): InventoryLog {
        return DB::transaction(function () use ($menuItem, $quantityChange, $changeType, $user, $reason): InventoryLog {
            $lockedMenuItem = MenuItem::query()->lockForUpdate()->findOrFail($menuItem->id);
            $quantityBefore = $lockedMenuItem->stock_quantity;
            $quantityAfter = $quantityBefore + $quantityChange;

            if ($quantityAfter < 0) {
                throw ValidationException::withMessages([
                    'items' => ['Insufficient stock for '.$lockedMenuItem->name.'.'],
                ]);
            }

            $lockedMenuItem->update([
                'stock_quantity' => $quantityAfter,
            ]);

            return InventoryLog::create([
                'menu_item_id' => $lockedMenuItem->id,
                'changed_by' => $user?->id,
                'change_type' => $changeType,
                'quantity_before' => $quantityBefore,
                'quantity_change' => $quantityChange,
                'quantity_after' => $quantityAfter,
                'reason' => $reason,
            ]);
        });
    }

    public function setStock(
        MenuItem $menuItem,
        int $stockQuantity,
        ?User $user = null,
        ?string $reason = null,
    ): InventoryLog {
        $quantityChange = $stockQuantity - $menuItem->stock_quantity;

        return $this->changeStock(
            $menuItem,
            $quantityChange,
            InventoryLog::TYPE_ADJUSTMENT,
            $user,
            $reason,
        );
    }

    public function bulkRestock(array $items, ?User $user = null, ?string $reason = null): Collection
    {
        return DB::transaction(function () use ($items, $user, $reason): Collection {
            $logs = new Collection;

            foreach ($items as $item) {
                $menuItem = MenuItem::query()->findOrFail($item['menu_item_id']);

                $logs->push($this->changeStock(
                    $menuItem,
                    (int) $item['quantity'],
                    InventoryLog::TYPE_RESTOCK,
                    $user,
                    $item['reason'] ?? $reason,
                ));
            }

            return $logs;
        });
    }
}
