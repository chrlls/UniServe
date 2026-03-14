<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    private const IMAGE_PATHS = [
        'Chicken Adobo Rice Bowl' => 'menu-items/1-chicken-adobo-rice-bowl-manual.webp',
        'Beef Tapa Meal' => 'menu-items/2-beef-tapa-meal-manual.jpg',
        'Fried Chicken Plate' => 'menu-items/3-fried-chicken-plate-manual.webp',
        'Pork Sisig Rice' => 'menu-items/4-pork-sisig-rice-manual.webp',
        'Vegetable Stir Fry' => 'menu-items/5-vegetable-stir-fry-pixabay.jpg',
        'Spaghetti with Garlic Bread' => 'menu-items/6-spaghetti-with-garlic-bread-pexels.jpg',
        'Ham Sandwich' => 'menu-items/7-ham-sandwich-pixabay.jpg',
        'Cheese Toastie' => 'menu-items/8-cheese-toastie-pexels.jpg',
        'French Fries' => 'menu-items/9-french-fries-pixabay.jpg',
        'Nacho Cup' => 'menu-items/10-nacho-cup-manual.webp',
        'Siomai Pack' => 'menu-items/11-siomai-pack-manual.webp',
        'Spring Rolls' => 'menu-items/12-spring-rolls-pexels.jpg',
        'Iced Tea' => 'menu-items/13-iced-tea-manual.webp',
        'Lemonade' => 'menu-items/14-lemonade-manual.webp',
        'Hot Coffee' => 'menu-items/15-hot-coffee-pixabay.jpg',
        'Chocolate Milk' => 'menu-items/16-chocolate-milk-manual.webp',
        'Bottled Water' => 'menu-items/17-bottled-water-manual.webp',
        'Fruit Smoothie' => 'menu-items/18-fruit-smoothie-manual.webp',
        'Brownie Square' => 'menu-items/19-brownie-square-manual.webp',
        'Leche Flan Cup' => 'menu-items/20-leche-flan-cup-manual.webp',
        'Banana Muffin' => 'menu-items/21-banana-muffin-pexels.jpg',
        'Chocolate Donut' => 'menu-items/22-chocolate-donut-manual.jpg',
        'Fruit Salad' => 'menu-items/23-fruit-salad-manual.jpg',
        'Cookies and Cream Cupcake' => 'menu-items/24-cookies-and-cream-cupcake-manual.jpg',
        'Burger Combo' => 'menu-items/25-burger-combo-manual.avif',
        'Chicken Combo' => 'menu-items/26-chicken-combo-manual.webp',
        'Pasta Combo' => 'menu-items/27-pasta-combo-manual.webp',
        'Snack Attack Combo' => 'menu-items/28-snack-attack-combo-manual.webp',
        'Breakfast Combo' => 'menu-items/29-breakfast-combo-manual.webp',
        'Study Buddy Combo' => 'menu-items/30-study-buddy-combo-manual.webp',
    ];

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
                $attributes = [
                    'category_id' => $category->id,
                    'description' => $item['name'].' prepared fresh for canteen service.',
                    'price' => $item['price'],
                    'is_available' => true,
                    'stock_quantity' => 1500,
                    'low_stock_threshold' => 20,
                ];

                if (array_key_exists($item['name'], self::IMAGE_PATHS)) {
                    $attributes['image_path'] = self::IMAGE_PATHS[$item['name']];
                }

                MenuItem::query()->updateOrCreate(
                    ['name' => $item['name']],
                    $attributes,
                );
            }
        }
    }
}
