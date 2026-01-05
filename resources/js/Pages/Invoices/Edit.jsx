import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Edit({ invoice, entities = [], categories = [], attachment = null }) {
    const [showAttachment, setShowAttachment] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        type: invoice.type || 'expense',
        entity_id: invoice.entity_id || '',
        supplier_name: invoice.entity_name || '',
        supplier_tax_id: invoice.entity_tax_id || '',
        supplier_email: '',
        supplier_type: invoice.entity_type || (invoice.type === 'income' ? 'customer' : 'supplier'),
        invoice_number: invoice.number || '',
        issue_date: invoice.issue_date || '',
        due_date: invoice.due_date || '',
        currency: invoice.currency || 'EUR',
        total_gross: invoice.total_gross ?? '',
        total_net: invoice.total_net ?? '',
        vat_percent: invoice.vat_percent ?? '',
        vat_amount: invoice.vat_amount ?? '',
        status: invoice.status || 'pending',
        description: invoice.description || '',
        category_id: invoice.category_id || '',
    });

    useEffect(() => {
        if (data.entity_id) {
            setData('supplier_name', '');
            setData('supplier_tax_id', '');
        }
    }, [data.entity_id]);

    const setType = (value) => {
        setData('type', value);
        setData('supplier_type', value === 'income' ? 'customer' : 'supplier');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('invoices.update', invoice.id));
    };

    const handleDelete = () => {
        if (confirm('Delete this invoice?')) {
            router.delete(route('invoices.destroy', invoice.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-slate-800">Edit Invoice</h2>}>
            <Head title="Edit Invoice" />

            <div className="space-y-6">
                {attachment && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowAttachment(!showAttachment)}
                            className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-50"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Original Invoice Document</h3>
                                <p className="text-sm text-slate-500">{attachment.original_name}</p>
                            </div>
                            <svg
                                className={`h-5 w-5 text-slate-400 transition-transform ${showAttachment ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showAttachment && (
                            <div className="border-t border-slate-200 p-4">
                                <iframe
                                    src={`/attachments/${attachment.id}/preview`}
                                    className="h-[600px] w-full rounded-lg border border-slate-200"
                                    title="Invoice Preview"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Update invoice</p>
                            <h3 className="text-2xl font-semibold text-slate-900">Invoice #{invoice.number || invoice.id}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                Delete
                            </button>
                            <Link
                                href={route('invoices.index')}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
                            >
                                Back
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setType('expense')}
                                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            data.type === 'expense'
                                                ? 'border-red-200 bg-red-50 text-red-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('income')}
                                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            data.type === 'income'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        Income
                                    </button>
                                </div>
                                {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Status</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('status', 'pending')}
                                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            data.status === 'pending'
                                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('status', 'paid')}
                                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            data.status === 'paid'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        Paid
                                    </button>
                                </div>
                                {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Business Entity</label>
                                <select
                                    value={data.entity_id}
                                    onChange={(e) => setData('entity_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none"
                                >
                                    <option value="">Select existing</option>
                                    {entities.map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name} {entity.tax_id ? `(${entity.tax_id})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Or set new entity name</label>
                                <input
                                    type="text"
                                    value={data.supplier_name}
                                    onChange={(e) => setData('supplier_name', e.target.value)}
                                    placeholder="Name"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.supplier_name && <p className="text-sm text-red-600">{errors.supplier_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Tax ID</label>
                                <input
                                    type="text"
                                    value={data.supplier_tax_id}
                                    onChange={(e) => setData('supplier_tax_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.supplier_tax_id && <p className="text-sm text-red-600">{errors.supplier_tax_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={data.supplier_email}
                                    onChange={(e) => setData('supplier_email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.supplier_email && <p className="text-sm text-red-600">{errors.supplier_email}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Invoice Number</label>
                                <input
                                    type="text"
                                    value={data.invoice_number}
                                    onChange={(e) => setData('invoice_number', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.invoice_number && <p className="text-sm text-red-600">{errors.invoice_number}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Issue Date</label>
                                <input
                                    type="date"
                                    value={data.issue_date}
                                    onChange={(e) => setData('issue_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.issue_date && <p className="text-sm text-red-600">{errors.issue_date}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Due Date</label>
                                <input
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.due_date && <p className="text-sm text-red-600">{errors.due_date}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Currency</label>
                                <select
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                >
                                    <option value="EUR">EUR (€)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                                {errors.currency && <p className="text-sm text-red-600">{errors.currency}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Total Gross</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.total_gross}
                                    onChange={(e) => setData('total_gross', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.total_gross && <p className="text-sm text-red-600">{errors.total_gross}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Total Net</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.total_net}
                                    onChange={(e) => setData('total_net', e.target.value)}
                                    placeholder="Optional"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.total_net && <p className="text-sm text-red-600">{errors.total_net}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">VAT %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.vat_percent}
                                    onChange={(e) => setData('vat_percent', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.vat_percent && <p className="text-sm text-red-600">{errors.vat_percent}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">VAT Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.vat_amount}
                                    onChange={(e) => setData('vat_amount', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                                />
                                {errors.vat_amount && <p className="text-sm text-red-600">{errors.vat_amount}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Category</label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none"
                            >
                                <option value="">No category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-sm text-red-600">{errors.category_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <textarea
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
                            />
                            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Link
                                href={route('invoices.index')}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Update Invoice
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
