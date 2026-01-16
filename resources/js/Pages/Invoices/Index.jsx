import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UploadModal from '@/Components/UploadModal';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Index({ invoices, filters = {}, entities = [], categories = [], summary = { count: 0, gross: 0 } }) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        status: filters.status || '',
        entity_id: filters.entity_id || '',
        category_id: filters.category_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        min_amount: filters.min_amount || '',
        max_amount: filters.max_amount || '',
        type: filters.type || 'all',
    });

    const currencySymbol = (currency) => {
        if (currency === 'USD') return '$';
        if (currency === 'GBP') return '£';
        return '€';
    };

    const statusClass = (status) => {
        if (!status) return 'bg-slate-100 text-slate-700';
        const normalized = status.toLowerCase();
        if (normalized === 'paid') return 'bg-emerald-100 text-emerald-700';
        if (normalized === 'pending') return 'bg-amber-100 text-amber-700';
        if (normalized === 'draft') return 'bg-blue-100 text-blue-700';
        return 'bg-slate-100 text-slate-700';
    };

    const hasInvoices = invoices?.data?.length > 0;

    const applyFilters = () => {
        router.get(route('invoices.index'), localFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const next = { ...localFilters, search: '', status: '', entity_id: '', category_id: '', start_date: '', end_date: '', min_amount: '', max_amount: '' };
        setLocalFilters(next);
        router.get(route('invoices.index'), next, { preserveState: true, replace: true });
    };

    const setTab = (type) => {
        const next = { ...localFilters, type };
        setLocalFilters(next);
        router.get(route('invoices.index'), next, { preserveState: true, replace: true });
    };

    const handleDelete = (invoiceId) => {
        if (confirm('Delete this invoice?')) {
            router.delete(route('invoices.destroy', invoiceId));
        }
    };

    const handleApprove = (invoiceId) => {
        if (confirm('Approve this invoice? It will no longer be marked as draft.')) {
            router.patch(route('invoices.approve', invoiceId), {}, {
                onSuccess: () => {
                    applyFilters();
                },
            });
        }
    };

    const summaryLabel = useMemo(() => {
        const gross = Number(summary.gross || 0).toFixed(2);
        return `${summary.count} invoices · €${gross}`;
    }, [summary]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-slate-800">Invoices</h2>}
        >
            <Head title="Invoices" />

            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm text-slate-500">Overview</p>
                        <h3 className="text-2xl font-semibold text-slate-900">Manage your invoices</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                            {summaryLabel}
                        </div>
                        <Link
                            href={route('invoices.create')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700"
                        >
                            New Invoice
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                        >
                            <span className="text-lg leading-none">＋</span>
                            Upload / Add
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                            <button
                                type="button"
                                onClick={() => setTab('all')}
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${localFilters.type === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-primary-700'}`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('income')}
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${localFilters.type === 'income' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-primary-700'}`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('expense')}
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${localFilters.type === 'expense' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-primary-700'}`}
                            >
                                Expenses
                            </button>
                        </div>

                        <input
                            type="text"
                            value={localFilters.search}
                            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Search invoices, company or number"
                            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary-300 focus:outline-none"
                        />

                        <button
                            type="button"
                            onClick={applyFilters}
                            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
                        <select
                            value={localFilters.status}
                            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary-300 focus:outline-none"
                        >
                            <option value="">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select
                            value={localFilters.entity_id}
                            onChange={(e) => setLocalFilters({ ...localFilters, entity_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary-300 focus:outline-none"
                        >
                            <option value="">Select company</option>
                            {entities.map((entity) => (
                                <option key={entity.id} value={entity.id}>
                                    {entity.name} {entity.tax_id ? `(${entity.tax_id})` : ''}
                                </option>
                            ))}
                        </select>

                        <select
                            value={localFilters.category_id}
                            onChange={(e) => setLocalFilters({ ...localFilters, category_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary-300 focus:outline-none"
                        >
                            <option value="">All categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm">
                            <label className="text-slate-500">Start</label>
                            <input
                                type="date"
                                value={localFilters.start_date}
                                onChange={(e) => setLocalFilters({ ...localFilters, start_date: e.target.value })}
                                className="flex-1 border-0 bg-transparent focus:outline-none focus:ring-0"
                            />
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm">
                            <label className="text-slate-500">End</label>
                            <input
                                type="date"
                                value={localFilters.end_date}
                                onChange={(e) => setLocalFilters({ ...localFilters, end_date: e.target.value })}
                                className="flex-1 border-0 bg-transparent focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm">
                            <label className="text-slate-500">Min €</label>
                            <input
                                type="number"
                                step="0.01"
                                value={localFilters.min_amount}
                                onChange={(e) => setLocalFilters({ ...localFilters, min_amount: e.target.value })}
                                className="flex-1 border-0 bg-transparent focus:outline-none focus:ring-0 "
                            />
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm">
                            <label className="text-slate-500">Max €</label>
                            <input
                                type="number"
                                step="0.01"
                                value={localFilters.max_amount}
                                onChange={(e) => setLocalFilters({ ...localFilters, max_amount: e.target.value })}
                                className="flex-1 border-0 bg-transparent focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {!hasInvoices ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                        <p className="mb-3 text-lg font-semibold text-slate-700">No invoices match these filters</p>
                        <p className="mb-6 text-sm text-slate-500">Adjust filters or upload a new invoice.</p>
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                        >
                            Upload & Extract
                        </button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">To / From</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tax ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">VAT (%)</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Net</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">File</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.data.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-semibold text-slate-900">{invoice.entity_name}</div>
                                                <div className="text-xs text-slate-500">{invoice.number || 'Unnumbered'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{invoice.entity_tax_id || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                                {currencySymbol(invoice.currency)}{Number(invoice.total_gross || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{invoice.vat_percent ? `${invoice.vat_percent}%` : 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{currencySymbol(invoice.currency)}{Number(invoice.total_net || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{invoice.currency}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{invoice.issue_date}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {invoice.category ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${invoice.category.color}20`, color: invoice.category.color }}>
                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: invoice.category.color }} />
                                                        {invoice.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(invoice.status)}`}>
                                                    {invoice.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-primary-600">
                                                {invoice.attachment_url ? (
                                                    <a href={invoice.attachment_url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                                                        View File
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    {invoice.status === 'draft' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApprove(invoice.id)}
                                                            className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('invoices.edit', invoice.id)}
                                                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-700"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(invoice.id)}
                                                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <div>
                                Page {invoices.current_page} of {invoices.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                {invoices.links?.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${link.active ? 'bg-primary-600 text-white' : 'border border-slate-200 text-slate-700 hover:border-primary-200 hover:text-primary-700'}`}
                                    >
                                        {link.label.replace('&raquo;', '›').replace('&laquo;', '‹')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
        </AuthenticatedLayout>
    );
}
