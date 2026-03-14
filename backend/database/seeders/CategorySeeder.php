<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Meals', 'description' => 'Hearty breakfast and lunch meals.'],
            ['name' => 'Snacks', 'description' => 'Quick bites for study breaks.'],
            ['name' => 'Beverages', 'description' => 'Hot and cold drinks.'],
            ['name' => 'Desserts', 'description' => 'Sweet treats and pastries.'],
            ['name' => 'Combos', 'description' => 'Value meal bundles for busy students.'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['name' => $category['name']],
                ['description' => $category['description']],
            );
        }
    }
}
