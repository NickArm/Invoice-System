<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::where('user_id', auth()->id())
            ->withCount('invoices')
            ->orderBy('name')
            ->get(['id', 'name', 'color', 'user_id']);

        return Inertia::render('Settings/InvoiceCategories', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        Category::create([
            'user_id' => auth()->id(),
            ...$validated,
        ]);

        return redirect()->route('settings.categories.index')->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        $this->authorizeCategory($category);

        $validated = $this->validateData($request);

        $category->update($validated);

        return redirect()->route('settings.categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        $this->authorizeCategory($category);

        $category->delete();

        return redirect()->route('settings.categories.index')->with('success', 'Category deleted successfully.');
    }

    private function authorizeCategory(Category $category): void
    {
        if ($category->user_id !== auth()->id()) {
            abort(403);
        }
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'color' => ['required', 'string', 'max:7', 'regex:/^#([A-Fa-f0-9]{6})$/'],
        ]);
    }
}
