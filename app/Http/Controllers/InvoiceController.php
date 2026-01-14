<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\BusinessEntity;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\BusinessEntityService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        $filters = request()->only([
            'type',
            'status',
            'search',
            'entity_id',
            'category_id',
            'start_date',
            'end_date',
            'min_amount',
            'max_amount',
        ]);

        $type = $filters['type'] ?? 'all';

        $query = Invoice::with(['businessEntity', 'attachment', 'category'])
            ->where('user_id', $userId);

        if (in_array($type, ['income', 'expense'])) {
            $query->where('type', $type);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['entity_id'])) {
            $query->where('business_entity_id', $filters['entity_id']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('businessEntity', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('tax_id', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('issue_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('issue_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['min_amount'])) {
            $query->where('total_gross', '>=', $filters['min_amount']);
        }

        if (!empty($filters['max_amount'])) {
            $query->where('total_gross', '<=', $filters['max_amount']);
        }

        $summaryQuery = (clone $query)->where('status', '!=', 'draft');
        $summary = [
            'count' => (clone $summaryQuery)->count(),
            'gross' => (float) (clone $summaryQuery)->sum('total_gross'),
        ];

        $invoices = $query
            ->latest('issue_date')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($invoice) => [
                'id' => $invoice->id,
                'entity_name' => $invoice->businessEntity?->name ?? 'N/A',
                'entity_tax_id' => $invoice->businessEntity?->tax_id,
                'number' => $invoice->number,
                'total_gross' => (float) $invoice->total_gross,
                'total_net' => (float) $invoice->total_net,
                'vat_percent' => $invoice->vat_percent,
                'currency' => $invoice->currency,
                'issue_date' => $invoice->issue_date?->format('d/m/Y'),
                'status' => $invoice->status,
                'type' => $invoice->type,
                'category' => $invoice->category ? [
                    'name' => $invoice->category->name,
                    'color' => $invoice->category->color,
                ] : null,
                'attachment_id' => $invoice->attachment?->id,
                'attachment_url' => $invoice->attachment ? route('attachments.preview', $invoice->attachment->id) : null,
            ]);

        $entities = BusinessEntity::where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name', 'tax_id']);

        $categories = Category::where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'filters' => [
                'type' => $type,
                'status' => $filters['status'] ?? '',
                'search' => $filters['search'] ?? '',
                'entity_id' => $filters['entity_id'] ?? '',
                'category_id' => $filters['category_id'] ?? '',
                'start_date' => $filters['start_date'] ?? '',
                'end_date' => $filters['end_date'] ?? '',
                'min_amount' => $filters['min_amount'] ?? '',
                'max_amount' => $filters['max_amount'] ?? '',
            ],
            'entities' => $entities,
            'categories' => $categories,
            'summary' => $summary,
        ]);
    }

    public function create()
    {
        $entities = BusinessEntity::where('user_id', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'tax_id', 'type']);

        $categories = Category::where('user_id', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('Invoices/Create', [
            'entities' => $entities,
            'categories' => $categories,
        ]);
    }

    public function extract(Attachment $attachment)
    {
        // Ensure user owns this attachment
        if ($attachment->user_id !== auth()->id()) {
            abort(403);
        }

        // Get categories for dropdown
        $categories = Category::where('user_id', auth()->id())
            ->get()
            ->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
            ]);

        return Inertia::render('Invoices/Extract', [
            'attachment' => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'path' => $attachment->path,
                'status' => $attachment->status,
                'extracted_data' => $attachment->extracted_data ?? [],
            ],
            'categories' => $categories,
            'queue' => request()->query('queue', ''),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'attachment_id' => 'nullable|exists:attachments,id',
            'type' => 'required|in:income,expense',
            'entity_id' => 'nullable|exists:business_entities,id',
            'supplier_name' => 'nullable|string|max:255',
            'supplier_tax_id' => 'nullable|string|max:255',
            'supplier_tax_office' => 'nullable|string|max:255',
            'supplier_email' => 'nullable|email|max:255',
            'supplier_address' => 'nullable|string|max:500',
            'supplier_city' => 'nullable|string|max:255',
            'supplier_country' => 'nullable|string|max:255',
            'supplier_postal_code' => 'nullable|string|max:50',
            'supplier_phone' => 'nullable|string|max:50',
            'supplier_mobile' => 'nullable|string|max:50',
            'supplier_type' => 'nullable|in:customer,supplier',
            'invoice_number' => 'nullable|string|max:255',
            'issue_date' => 'required|date',
            'due_date' => 'nullable|date',
            'total_gross' => 'required|numeric',
            'total_net' => 'nullable|numeric',
            'vat_percent' => 'nullable|numeric',
            'vat_amount' => 'nullable|numeric',
            'currency' => 'required|string',
            'status' => 'required|in:pending,paid',
            'description' => 'nullable|string',
            'categories' => 'nullable|array',
            'items' => 'nullable|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
            'items.*.tax_rate' => 'required|numeric',
            'items.*.line_total' => 'required|numeric',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $totalNet = $validated['total_net'] ?? $validated['total_gross'];

        $categoryId = null;
        if (!empty($validated['category_id'])) {
            $categoryId = Category::where('user_id', auth()->id())
                ->where('id', $validated['category_id'])
                ->value('id');
        }

        // Create or find business entity using service
        $entityService = new BusinessEntityService();

        try {
            $entity = $entityService->findOrCreate(auth()->id(), $validated);
        } catch (\Exception $e) {
            // If duplicate name with different Tax ID detected, return error
            return back()->withErrors([
                'supplier_name' => $e->getMessage()
            ])->withInput();
        }

        // Check for duplicate invoice
        if ($validated['invoice_number'] && $entity && $entityService->isDuplicate(auth()->id(), $validated['invoice_number'], $entity->id)) {
            return back()->withErrors([
                'invoice_number' => $entityService->getDuplicateMessage($entity, $validated['invoice_number'])
            ])->withInput();
        }

        // Create invoice
        $invoice = Invoice::create([
            'user_id' => auth()->id(),
            'business_entity_id' => $entity?->id,
            'category_id' => $categoryId,
            'type' => $validated['type'],
            'status' => $validated['status'],
            'number' => $validated['invoice_number'],
            'issue_date' => $validated['issue_date'],
            'due_date' => $validated['due_date'],
            'currency' => $validated['currency'],
            'total_gross' => $validated['total_gross'],
            'total_net' => $totalNet,
            'vat_percent' => $validated['vat_percent'] ?? null,
            'vat_amount' => $validated['vat_amount'] ?? null,
            'description' => $validated['description'],
        ]);

        // Create invoice items
        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $qty = $item['quantity'] ?? $item['qty'] ?? 1;
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'qty' => $qty,
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'],
                    'line_total' => $item['line_total'],
                    'category_id' => $item['category_id'] ?? null,
                ]);
            }
        }

        // Link attachment to invoice
        if (!empty($validated['attachment_id'])) {
            $attachment = Attachment::find($validated['attachment_id']);
            if ($attachment && $attachment->user_id === auth()->id()) {
                $attachment->update([
                    'invoice_id' => $invoice->id,
                    'status' => 'processed',
                ]);
            }
        }

        return redirect()->route('invoices.index')->with('success', 'Invoice created successfully!');
    }

    public function edit(Invoice $invoice)
    {
        if ($invoice->user_id !== auth()->id()) {
            abort(403);
        }

        $entities = BusinessEntity::where('user_id', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'tax_id', 'type']);

        $categories = Category::where('user_id', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        $attachment = $invoice->attachment;

        return Inertia::render('Invoices/Edit', [
            'invoice' => [
                'id' => $invoice->id,
                'entity_id' => $invoice->business_entity_id,
                'entity_name' => $invoice->businessEntity?->name,
                'entity_tax_id' => $invoice->businessEntity?->tax_id,
                'entity_type' => $invoice->businessEntity?->type,
                'type' => $invoice->type,
                'status' => $invoice->status,
                'number' => $invoice->number,
                'issue_date' => optional($invoice->issue_date)->format('Y-m-d'),
                'due_date' => optional($invoice->due_date)->format('Y-m-d'),
                'currency' => $invoice->currency,
                'total_gross' => $invoice->total_gross,
                'total_net' => $invoice->total_net,
                'vat_percent' => $invoice->vat_percent,
                'vat_amount' => $invoice->vat_amount,
                'description' => $invoice->description,
                'category_id' => $invoice->category_id,
            ],
            'attachment' => $attachment ? [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'path' => $attachment->path,
            ] : null,
            'entities' => $entities,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|in:income,expense',
            'entity_id' => 'nullable|exists:business_entities,id',
            'supplier_name' => 'nullable|string|max:255',
            'supplier_tax_id' => 'nullable|string|max:255',
            'supplier_tax_office' => 'nullable|string|max:255',
            'supplier_email' => 'nullable|email|max:255',
            'supplier_address' => 'nullable|string|max:500',
            'supplier_city' => 'nullable|string|max:255',
            'supplier_country' => 'nullable|string|max:255',
            'supplier_postal_code' => 'nullable|string|max:50',
            'supplier_phone' => 'nullable|string|max:50',
            'supplier_mobile' => 'nullable|string|max:50',
            'supplier_type' => 'nullable|in:customer,supplier',
            'invoice_number' => 'nullable|string|max:255',
            'issue_date' => 'required|date',
            'due_date' => 'nullable|date',
            'total_gross' => 'required|numeric',
            'total_net' => 'nullable|numeric',
            'vat_percent' => 'nullable|numeric',
            'vat_amount' => 'nullable|numeric',
            'currency' => 'required|string',
            'status' => 'required|in:pending,paid',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $totalNet = $validated['total_net'] ?? $validated['total_gross'];

        $categoryId = null;
        if (!empty($validated['category_id'])) {
            $categoryId = Category::where('user_id', auth()->id())
                ->where('id', $validated['category_id'])
                ->value('id');
        }

        // Create or find business entity using service
        $entityService = new BusinessEntityService();
        $entity = $entityService->findOrCreate(auth()->id(), $validated);

        $invoice->update([
            'business_entity_id' => $entity?->id,
            'type' => $validated['type'],
            'status' => $validated['status'],
            'number' => $validated['invoice_number'],
            'issue_date' => $validated['issue_date'],
            'due_date' => $validated['due_date'],
            'currency' => $validated['currency'],
            'total_gross' => $validated['total_gross'],
            'total_net' => $totalNet,
            'vat_percent' => $validated['vat_percent'] ?? null,
            'vat_amount' => $validated['vat_amount'] ?? null,
            'description' => $validated['description'],
            'category_id' => $categoryId,
        ]);

        return redirect()->route('invoices.index')->with('success', 'Invoice updated successfully!');
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->user_id !== auth()->id()) {
            abort(403);
        }

        // Remove items and detach attachments
        if (method_exists($invoice, 'items')) {
            $invoice->items()->delete();
        }

        Attachment::where('invoice_id', $invoice->id)
            ->where('user_id', auth()->id())
            ->update(['invoice_id' => null, 'status' => 'uploaded']);

        $invoice->delete();

        return redirect()->route('invoices.index')->with('success', 'Invoice deleted successfully!');
    }
}
