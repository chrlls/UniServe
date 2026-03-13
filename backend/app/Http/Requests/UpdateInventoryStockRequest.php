<?php

namespace App\Http\Requests;

class UpdateInventoryStockRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
