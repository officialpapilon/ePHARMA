<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'category' => $this->category,
            'price' => (string) $this->price, // Ensure price is returned as a string
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'description' => $this->description,
            'quantity' => (string) $this->quantity, // Ensure quantity is returned as a string
            'brand' => $this->brand,
            'unit' => $this->unit,
            'supplier' => $this->supplier,
            'manufacture_date' => $this->manufacture_date,
            'expire_date' => $this->expire_date,
            'batch_number' => $this->batch_number,
        ];
    }
}
