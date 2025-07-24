<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Item;

class ItemSeeder extends Seeder
{
    public function run()
    {
        Item::create([
            'name' => 'Paracetamol',
            'code' => 'MED001',
            'category' => 'Painkiller',
            'price' => 5.00,
            'quantity' => 0.00,
            'description' => null,
            'brand' => null,
            'unit' => null,
            'supplier' => null,
            'manufacture_date' => null,
            'expire_date' => null,
            'batch_number' => null,
        ]);

    }
}
