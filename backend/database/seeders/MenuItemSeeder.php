<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    public const MENU_ITEMS = [
        'Meals' => [
            ['name' => 'Chicken Adobo Rice Bowl', 'price' => 89],
            ['name' => 'Beef Tapa Meal', 'price' => 99],
            ['name' => 'Fried Chicken Plate', 'price' => 95],
            ['name' => 'Pork Sisig Rice', 'price' => 92],
            ['name' => 'Vegetable Stir Fry', 'price' => 79],
            ['name' => 'Spaghetti with Garlic Bread', 'price' => 85],
        ],
        'Snacks' => [
            ['name' => 'Ham Sandwich', 'price' => 45],
            ['name' => 'Cheese Toastie', 'price' => 55],
            ['name' => 'French Fries', 'price' => 65],
            ['name' => 'Nacho Cup', 'price' => 69],
            ['name' => 'Siomai Pack', 'price' => 50],
            ['name' => 'Spring Rolls', 'price' => 42],
        ],
        'Beverages' => [
            ['name' => 'Iced Tea', 'price' => 25],
            ['name' => 'Lemonade', 'price' => 35],
            ['name' => 'Hot Coffee', 'price' => 45],
            ['name' => 'Chocolate Milk', 'price' => 55],
            ['name' => 'Bottled Water', 'price' => 20],
            ['name' => 'Fruit Smoothie', 'price' => 75],
        ],
        'Desserts' => [
            ['name' => 'Brownie Square', 'price' => 35],
            ['name' => 'Leche Flan Cup', 'price' => 40],
            ['name' => 'Banana Muffin', 'price' => 38],
            ['name' => 'Chocolate Donut', 'price' => 35],
            ['name' => 'Fruit Salad', 'price' => 55],
            ['name' => 'Cookies and Cream Cupcake', 'price' => 48],
        ],
        'Combos' => [
            ['name' => 'Burger Combo', 'price' => 129],
            ['name' => 'Chicken Combo', 'price' => 149],
            ['name' => 'Pasta Combo', 'price' => 139],
            ['name' => 'Snack Attack Combo', 'price' => 119],
            ['name' => 'Breakfast Combo', 'price' => 129],
            ['name' => 'Study Buddy Combo', 'price' => 109],
        ],
    ];

    public function run(): void
    {
        foreach (self::MENU_ITEMS as $categoryName => $items) {
            $category = Category::query()->where('name', $categoryName)->firstOrFail();

            foreach ($items as $item) {
                MenuItem::query()->updateOrCreate(
                    ['name' => $item['name']],
                    [
                        'category_id' => $category->id,
                        'description' => $item['name'].' prepared fresh for canteen service.',
                        'price' => $item['price'],
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
