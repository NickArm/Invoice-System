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

        // Admin can see all entities; regular users see only their own
        $query = BusinessEntity::query()
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
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

    public function edit(BusinessEntity $businessEntity)
    {
        // Ensure user owns this entity (admins bypass)
        if ($businessEntity->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            abort(403);
        }

        return Inertia::render('BusinessEntities/Edit', [
            'entity' => [
                'id' => $businessEntity->id,
                'name' => $businessEntity->name,
                'tax_id' => $businessEntity->tax_id,
                'tax_office' => $businessEntity->tax_office,
                'email' => $businessEntity->email,
                'country' => $businessEntity->country,
                'city' => $businessEntity->city,
                'address' => $businessEntity->address,
                'postal_code' => $businessEntity->postal_code,
                'phone' => $businessEntity->phone,
                'mobile' => $businessEntity->mobile,
                'type' => $businessEntity->type,
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

    public function update(Request $request, BusinessEntity $businessEntity)
    {
        // Ensure user owns this entity (admins bypass)
        if ($businessEntity->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
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

        $businessEntity->update($validated);

        return redirect()->route('business-entities.index')->with('success', 'Business entity updated successfully!');
    }

    public function destroy(BusinessEntity $businessEntity)
    {
        // Ensure user owns this entity (admins bypass)
        if ($businessEntity->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            abort(403);
        }

        $businessEntity->delete();

        return redirect()->route('business-entities.index')->with('success', 'Business entity deleted successfully!');
    }
}
