<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\ToggleMenuItemAvailabilityRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::query()->with('category')->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->value();
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%');
            });
        }

        if ($request->filled('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $menuItems = $query->get();

        return $this->successResponse([
            'menu_items' => MenuItemResource::collection($menuItems)->resolve(),
        ]);
    }

    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['is_available'] = $request->has('is_available') ? $request->boolean('is_available') : true;
        $validated['image_path'] = $this->storeImage($request->file('image'));
        unset($validated['image']);

        $menuItem = MenuItem::create($validated)->refresh()->load('category');

        return $this->successResponse([
            'menu_item' => (new MenuItemResource($menuItem))->resolve(),
        ], 'Menu item created successfully.', 201);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        $menuItem->load('category');

        return $this->successResponse([
            'menu_item' => (new MenuItemResource($menuItem))->resolve(),
        ]);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $this->deleteImage($menuItem->image_path);
            $validated['image_path'] = $this->storeImage($request->file('image'));
        }

        if ($request->has('is_available')) {
            $validated['is_available'] = $request->boolean('is_available');
        }

        unset($validated['image']);

        $menuItem->update($validated);
        $menuItem->load('category');

        return $this->successResponse([
            'menu_item' => (new MenuItemResource($menuItem))->resolve(),
        ], 'Menu item updated successfully.');
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        if ($menuItem->orderItems()->exists() || $menuItem->inventoryLogs()->exists()) {
            $menuItem->update([
                'is_available' => false,
            ]);
            $menuItem->load('category');

            return $this->successResponse([
                'menu_item' => (new MenuItemResource($menuItem))->resolve(),
                'deleted' => false,
                'archived' => true,
            ], 'Menu item has existing order or inventory history, so it was hidden instead of deleted.');
        }

        $this->deleteImage($menuItem->image_path);
        $menuItem->delete();

        return $this->successResponse([
            'deleted' => true,
            'archived' => false,
        ], 'Menu item deleted successfully.');
    }

    public function toggleAvailability(ToggleMenuItemAvailabilityRequest $request, MenuItem $menuItem): JsonResponse
    {
        $menuItem->update([
            'is_available' => $request->boolean('is_available'),
        ]);

        $menuItem->load('category');

        return $this->successResponse([
            'menu_item' => (new MenuItemResource($menuItem))->resolve(),
        ], 'Menu item availability updated successfully.');
    }

    private function storeImage(?UploadedFile $image): ?string
    {
        if ($image === null) {
            return null;
        }

        return $image->store('menu-items', 'public');
    }

    private function deleteImage(?string $imagePath): void
    {
        if ($imagePath !== null && Storage::disk('public')->exists($imagePath)) {
            Storage::disk('public')->delete($imagePath);
        }
    }
}
