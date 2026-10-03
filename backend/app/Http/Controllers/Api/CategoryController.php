<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\BusinessRuleException;
use Illuminate\Http\Request;

class CategoryController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Category::query()
            ->with('parent')
            ->withCount('products')
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->query('search').'%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $like)->orWhere('code', 'like', $like));
            })
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $this->boolFromRequest($request, 'is_active')))
            ->when($request->filled('parent_id'), fn ($q) => $q->where('parent_id', $request->integer('parent_id')))
            ->orderBy('name');

        return CategoryResource::collection($this->paginate($request, $query));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:40', 'unique:categories,code'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = Category::create($data);

        return CategoryResource::make($category->load('parent')->loadCount('products'))->response()->setStatusCode(201);
    }

    public function show(Category $category)
    {
        return CategoryResource::make($category->load('parent')->loadCount('products'));
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:40', 'unique:categories,code,'.$category->id],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (($data['parent_id'] ?? null) === $category->id) {
            throw new BusinessRuleException('A category cannot be its own parent.');
        }

        $category->fill($data)->save();

        return CategoryResource::make($category->load('parent')->loadCount('products'));
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists() || $category->children()->exists()) {
            throw new BusinessRuleException(
                'This category has products or sub-categories. Move them first, or deactivate it.'
            );
        }

        $category->delete();

        return $this->message('Category deleted.');
    }
}