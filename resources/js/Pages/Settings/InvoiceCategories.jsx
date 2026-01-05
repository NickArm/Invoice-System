import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const COLOR_PRESETS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899'];

export default function InvoiceCategories({ categories = [] }) {
    const defaultColor = COLOR_PRESETS[0];
    const createForm = useForm({ name: '', color: defaultColor });
    const editForm = useForm({ name: '', color: defaultColor });
    const [editingId, setEditingId] = useState(null);

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('settings.categories.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('color', defaultColor);
            },
        });
    };

    const startEdit = (category) => {
        setEditingId(category.id);
        editForm.setData('name', category.name);
        editForm.setData('color', category.color);
    };

    const cancelEdit = () => {
        setEditingId(null);
        editForm.reset();
        editForm.setData('color', defaultColor);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editingId) return;

        editForm.patch(route('settings.categories.update', editingId), {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
        });
    };

    const handleDelete = (id) => {
        if (confirm('Delete this category? Invoices using it will be left without a category.')) {
            router.delete(route('settings.categories.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const renderSwatches = (selected, onSelect) => (
        <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onSelect(color)}
                    className={`h-8 w-8 rounded-full border transition ${
                        selected === color ? 'ring-2 ring-offset-2 ring-indigo-500' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Choose ${color}`}
                />
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200">
                Custom
                <input
                    type="color"
                    value={selected}
                    onChange={(e) => onSelect(e.target.value)}
                    className="h-6 w-10 cursor-pointer border-0 bg-transparent p-0"
                />
            </label>
        </div>
    );

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-slate-800">Invoice Categories</h2>}>
            <Head title="Invoice Categories" />

            <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                            <p className="text-sm text-slate-500">Organize invoices with custom labels</p>
                            <h3 className="text-2xl font-semibold text-slate-900">Create category</h3>
                        </div>
                        <form className="space-y-4" onSubmit={submitCreate}>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="e.g. Marketing, Office"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {createForm.errors.name && (
                                    <p className="text-sm text-red-600">{createForm.errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Color</label>
                                {renderSwatches(createForm.data.color, (color) => createForm.setData('color', color))}
                                {createForm.errors.color && (
                                    <p className="text-sm text-red-600">{createForm.errors.color}</p>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Add category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Existing categories</p>
                                <h3 className="text-2xl font-semibold text-slate-900">Manage</h3>
                            </div>
                            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-600">
                                {categories.length} total
                            </div>
                        </div>

                        {categories.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">
                                <p className="text-sm">No categories yet. Create your first one to start tagging invoices.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-px hover:shadow-md"
                                    >
                                        {editingId === category.id ? (
                                            <form className="space-y-3" onSubmit={submitEdit}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className="h-8 w-8 rounded-full border border-slate-200"
                                                            style={{ backgroundColor: editForm.data.color }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editForm.data.name}
                                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                                            className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={editForm.processing}
                                                            className="rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                                {renderSwatches(editForm.data.color, (color) => editForm.setData('color', color))}
                                                {(editForm.errors.name || editForm.errors.color) && (
                                                    <div className="text-sm text-red-600">
                                                        {editForm.errors.name || editForm.errors.color}
                                                    </div>
                                                )}
                                            </form>
                                        ) : (
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="h-10 w-10 rounded-full border border-slate-200"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    <div>
                                                        <div className="text-base font-semibold text-slate-900">{category.name}</div>
                                                        <div className="text-xs uppercase tracking-wide text-slate-500">
                                                            {category.invoices_count} invoices
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-auto flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(category)}
                                                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(category.id)}
                                                        className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
