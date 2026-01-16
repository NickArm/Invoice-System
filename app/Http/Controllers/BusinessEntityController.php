<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorBusinessEntityRequest;
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
        // Ensure user owns this entity
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

    public function store(StorBusinessEntityRequest $request)
    {
        BusinessEntity::create(array_merge($request->validated(), [
            'user_id' => auth()->id(),
        ]));

        return redirect()->route('business-entities.index')->with('success', 'Business entity created successfully!');
    }

    public function update(StorBusinessEntityRequest $request, BusinessEntity $businessEntity)
    {
        // Ensure user owns this entity
        if ($businessEntity->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            abort(403);
        }

        $businessEntity->update($request->validated());

        return redirect()->route('business-entities.index')->with('success', 'Business entity updated successfully!');
    }

    public function destroy(BusinessEntity $businessEntity)
    {
        // Ensure user owns this entity
        if ($businessEntity->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            abort(403);
        }

        // Check if entity has any invoices
        if ($businessEntity->invoices()->exists()) {
            return back()->withErrors([
                'invoices' => 'Δεν μπορείτε να διαγράψετε αυτή τη λογιστική οντότητα γιατί έχει συνδεδεμένα τιμολόγια. Διαγράψτε πρώτα τα σχετικά τιμολόγια.'
            ]);
        }

        $businessEntity->delete();

        return redirect()->route('business-entities.index')->with('success', 'Business entity deleted successfully!');
    }
}
