<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('menuItems')
            ->latest()
            ->get();

        return $this->successResponse([
            'categories' => CategoryResource::collection($categories)->resolve(),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return $this->successResponse([
            'category' => (new CategoryResource($category))->resolve(),
        ], 'Category created successfully.', 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->loadCount('menuItems');

        return $this->successResponse([
            'category' => (new CategoryResource($category))->resolve(),
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());
        $category->loadCount('menuItems');

        return $this->successResponse([
            'category' => (new CategoryResource($category))->resolve(),
        ], 'Category updated successfully.');
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return $this->successResponse(data: null, message: 'Category deleted successfully.');
    }
}

