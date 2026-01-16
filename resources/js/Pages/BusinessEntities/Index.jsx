import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ entities, filters }) {
    const { errors } = usePage().props;
    const [errorMessage, setErrorMessage] = useState(null);

    const badgeClass = (type) => {
        if (type === 'Supplier') return 'bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-900/40 dark:text-primary-400 dark:border-primary-900';
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-900';
    };

    const handleDelete = (id) => {
        if (confirm('Delete this business entity?')) {
            router.delete(route('business-entities.destroy', id), {
                onError: (errors) => {
                    setErrorMessage(errors.invoices);
                },
                onSuccess: () => {
                    setErrorMessage(null);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">Business Entities</h2>}
        >
            <Head title="Business Entities" />

            <div className="space-y-6">
                {(errorMessage || errors?.invoices) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">{errorMessage || errors?.invoices}</p>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Directory</p>
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">All Entities</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            {entities.total} total
                        </div>
                        <Link
                            href={route('business-entities.create')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
                        >
                            New Entity
                        </Link>
                    </div>
                </div>

                {entities.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        <p className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">No business entities found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Entities are created automatically when you upload invoices.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entities.data.map((entity) => (
                            <div
                                key={entity.id}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-px hover:shadow-md sm:px-5 dark:border-slate-700 dark:bg-slate-900 dark:hover:shadow-slate-800"
                            >
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                    <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{entity.name}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{entity.tax_id || 'No tax ID'}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{entity.email || 'No email'}</div>
                                    </div>

                                    <div className="flex flex-col gap-1 text-sm text-slate-600 sm:min-w-[140px] dark:text-slate-400">
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</span>
                                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(entity.type)}`}>
                                            {entity.type}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 text-sm text-slate-600 sm:min-w-[120px] dark:text-slate-400">
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoices</span>
                        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{entity.invoices_count}</span>
                                    </div>

                                    <div className="flex flex-1 items-center justify-end gap-2">
                                        <Link
                                            href={route('business-entities.edit', entity.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(entity.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
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
                                className={`min-w-[36px] rounded-full px-3 py-1 text-sm font-semibold transition ${
                                    link.active
                        ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-600 dark:text-white'
                        : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-primary-700 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:text-primary-400'
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
