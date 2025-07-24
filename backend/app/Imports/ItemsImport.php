<?php

namespace App\Imports;

use App\Models\Item;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItemsImport implements ToArray, WithHeadingRow
{
    public function array(array $rows)
    {
        // Return formatted data as an array
        return array_map(function ($row) {
            return [
                'name' => $row['name'],
                'code' => $row['code'],
                'category' => $row['category'],
                'price' => $row['price'],
            ];
        }, $rows);
    }
}
