<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $menuItems = [
            'Meals' => ['Chicken Adobo Rice Bowl', 'Beef Tapa Meal', 'Fried Chicken Plate', 'Pork Sisig Rice', 'Vegetable Stir Fry', 'Spaghetti with Garlic Bread'],
            'Snacks' => ['Ham Sandwich', 'Cheese Toastie', 'French Fries', 'Nacho Cup', 'Siomai Pack', 'Spring Rolls'],
            'Beverages' => ['Iced Tea', 'Lemonade', 'Hot Coffee', 'Chocolate Milk', 'Bottled Water', 'Fruit Smoothie'],
            'Desserts' => ['Brownie Square', 'Leche Flan Cup', 'Banana Muffin', 'Chocolate Donut', 'Fruit Salad', 'Cookies and Cream Cupcake'],
            'Combos' => ['Burger Combo', 'Chicken Combo', 'Pasta Combo', 'Snack Attack Combo', 'Breakfast Combo', 'Study Buddy Combo'],
        ];

        foreach ($menuItems as $categoryName => $items) {
            $category = Category::query()->where('name', $categoryName)->firstOrFail();

            foreach ($items as $index => $name) {
                MenuItem::query()->updateOrCreate(
                    ['name' => $name],
                    [
                        'category_id' => $category->id,
                        'description' => $name.' prepared fresh for canteen service.',
                        'price' => 45 + ($index * 7),
                        'is_available' => true,
                        'image_path' => null,
                        'stock_quantity' => 1500,
                        'low_stock_threshold' => 20,
                    ],
                );
            }
        }
    }
}

