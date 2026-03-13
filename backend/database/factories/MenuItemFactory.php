<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 2, 25),
            'is_available' => true,
            'image_path' => null,
            'stock_quantity' => fake()->numberBetween(50, 250),
            'low_stock_threshold' => fake()->numberBetween(5, 20),
        ];
    }
}
