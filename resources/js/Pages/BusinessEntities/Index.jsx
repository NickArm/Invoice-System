import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ entities, filters }) {
    const badgeClass = (type) => {
        if (type === 'Supplier') return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    };

    const handleDelete = (id) => {
        if (confirm('Delete this business entity?')) {
            router.delete(route('business-entities.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-slate-800">Business Entities</h2>}
        >
            <Head title="Business Entities" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm text-slate-500">Directory</p>
                        <h3 className="text-2xl font-semibold text-slate-900">All Entities</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                            {entities.total} total
                        </div>
                        <Link
                            href={route('business-entities.create')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                        >
                            New Entity
                        </Link>
                    </div>
                </div>

                {entities.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                        <p className="mb-2 text-lg font-semibold text-slate-700">No business entities found</p>
                        <p className="text-sm text-slate-500">Entities are created automatically when you upload invoices.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entities.data.map((entity) => (
                            <div
                                key={entity.id}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-px hover:shadow-md sm:px-5"
                            >
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                    <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                                        <div className="text-base font-semibold text-slate-900">{entity.name}</div>
                                        <div className="text-xs uppercase tracking-wide text-slate-500">{entity.tax_id || 'No tax ID'}</div>
                                        <div className="text-sm text-slate-600">{entity.email || 'No email'}</div>
                                    </div>

                                    <div className="flex flex-col gap-1 text-sm text-slate-600 sm:min-w-[140px]">
                                        <span className="text-xs uppercase tracking-wide text-slate-500">Type</span>
                                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(entity.type)}`}>
                                            {entity.type}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 text-sm text-slate-600 sm:min-w-[120px]">
                                        <span className="text-xs uppercase tracking-wide text-slate-500">Invoices</span>
                                        <span className="text-lg font-semibold text-slate-900">{entity.invoices_count}</span>
                                    </div>

                                    <div className="flex flex-1 items-center justify-end">
                                        <Link
                                            href={route('business-entities.edit', entity.id)}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(entity.id)}
                                            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {entities.links && entities.links.length > 3 && (
                    <div className="flex items-center justify-center gap-2">
                        {entities.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`min-w-[36px] rounded-full px-3 py-1 text-sm font-semibold ${
                                    link.active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-indigo-700'
                                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
