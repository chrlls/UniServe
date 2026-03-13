<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'cashier_id' => $this->cashier_id,
            'total_amount' => (float) $this->total_amount,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'ordered_at' => optional($this->ordered_at)->toISOString(),
            'customer' => $this->whenLoaded('customer', fn (): array => (new UserResource($this->customer))->resolve()),
            'cashier' => $this->whenLoaded('cashier', fn (): array => (new UserResource($this->cashier))->resolve()),
            'items' => $this->whenLoaded('items', fn (): array => OrderItemResource::collection($this->items)->resolve()),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
