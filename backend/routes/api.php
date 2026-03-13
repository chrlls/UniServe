<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});

Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');

Route::get('/menu-items', [MenuController::class, 'index'])->name('menu-items.index');
Route::get('/menu-items/{menuItem}', [MenuController::class, 'show'])->name('menu-items.show');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/orders', [OrderController::class, 'store'])
        ->middleware('role:admin,cashier,customer')
        ->name('orders.store');

    Route::get('/orders/{order}', [OrderController::class, 'show'])
        ->middleware('role:admin,cashier,customer')
        ->name('orders.show');

    Route::middleware('role:admin')->group(function (): void {
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::match(['put', 'patch'], '/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::post('/menu-items', [MenuController::class, 'store'])->name('menu-items.store');
        Route::match(['put', 'patch'], '/menu-items/{menuItem}', [MenuController::class, 'update'])->name('menu-items.update');
        Route::delete('/menu-items/{menuItem}', [MenuController::class, 'destroy'])->name('menu-items.destroy');
        Route::patch('/menu-items/{menuItem}/availability', [MenuController::class, 'toggleAvailability'])
            ->name('menu-items.toggle-availability');

        Route::prefix('reports')->group(function (): void {
            Route::get('/sales-summary', [ReportController::class, 'salesSummary'])->name('reports.sales-summary');
            Route::get('/best-selling-items', [ReportController::class, 'bestSellingItems'])->name('reports.best-selling-items');
            Route::get('/order-trends', [ReportController::class, 'orderTrends'])->name('reports.order-trends');
            Route::get('/category-breakdown', [ReportController::class, 'categoryBreakdown'])->name('reports.category-breakdown');
        });

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::get('/orders', [OrderController::class, 'index'])
        ->middleware('role:admin,cashier,customer')
        ->name('orders.index');

    Route::middleware('role:admin,cashier')->group(function (): void {
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

        Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::patch('/inventory/{menuItem}/stock', [InventoryController::class, 'updateStock'])->name('inventory.update-stock');
        Route::post('/inventory/restock', [InventoryController::class, 'bulkRestock'])->name('inventory.bulk-restock');
    });
});
