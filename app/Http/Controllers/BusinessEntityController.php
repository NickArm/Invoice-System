<?php

namespace App\Http\Controllers;

use App\Models\BusinessEntity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusinessEntityController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $query = BusinessEntity::where('user_id', $user->id)
            ->withCount('invoices')
            ->latest();

        // Apply filters
        if (request('type')) {
            $query->where('type', request('type'));
        }
        if (request('search')) {
            $query->where(function ($q) {
                $q->where('name', 'like', '%' . request('search') . '%')
                  ->orWhere('tax_id', 'like', '%' . request('search') . '%')
                  ->orWhere('email', 'like', '%' . request('search') . '%');
            });
        }

        $entities = $query->paginate(20)->through(fn ($entity) => [
            'id' => $entity->id,
            'name' => $entity->name,
            'tax_id' => $entity->tax_id,
            'email' => $entity->email,
            'type' => ucfirst($entity->type),
            'invoices_count' => $entity->invoices_count,
        ]);

        return Inertia::render('BusinessEntities/Index', [
            'entities' => $entities,
            'filters' => request()->only(['type', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('BusinessEntities/Create');
    }

    public function edit(BusinessEntity $entity)
    {
        // Ensure user owns this entity
        if ($entity->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('BusinessEntities/Edit', [
            'entity' => [
                'id' => $entity->id,
                'name' => $entity->name,
                'tax_id' => $entity->tax_id,
                'tax_office' => $entity->tax_office,
                'email' => $entity->email,
                'country' => $entity->country,
                'city' => $entity->city,
                'address' => $entity->address,
                'postal_code' => $entity->postal_code,
                'phone' => $entity->phone,
                'mobile' => $entity->mobile,
                'type' => $entity->type,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'tax_office' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'country' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'type' => 'required|in:customer,supplier',
        ]);

        BusinessEntity::create(array_merge($validated, [
            'user_id' => auth()->id(),
        ]));

        return redirect()->route('business-entities.index')->with('success', 'Business entity created successfully!');
    }

    public function update(Request $request, BusinessEntity $entity)
    {
        // Ensure user owns this entity
        if ($entity->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'tax_office' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'country' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'type' => 'required|in:customer,supplier',
        ]);

        $entity->update($validated);

        return redirect()->route('business-entities.index')->with('success', 'Business entity updated successfully!');
    }

    public function destroy(BusinessEntity $entity)
    {
        // Ensure user owns this entity
        if ($entity->user_id !== auth()->id()) {
            abort(403);
        }

        $entity->delete();

        return redirect()->route('business-entities.index')->with('success', 'Business entity deleted successfully!');
    }
}
