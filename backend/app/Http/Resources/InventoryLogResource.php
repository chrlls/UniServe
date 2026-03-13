<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryLogResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'changed_by' => $this->changed_by,
            'change_type' => $this->change_type,
            'quantity_before' => $this->quantity_before,
            'quantity_change' => $this->quantity_change,
            'quantity_after' => $this->quantity_after,
            'reason' => $this->reason,
            'menu_item' => $this->whenLoaded('menuItem', fn (): array => (new MenuItemResource($this->menuItem))->resolve()),
            'changed_by_user' => $this->whenLoaded('changedBy', fn (): array => (new UserResource($this->changedBy))->resolve()),
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
