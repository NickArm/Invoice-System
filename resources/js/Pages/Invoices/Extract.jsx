import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Extract({ attachment, categories, queue, errors: serverErrors }) {
    const initialQueue = queue ? queue.split(',').filter(Boolean) : [];
    const [loading, setLoading] = useState(attachment.status === 'uploaded');
    const [pendingQueue, setPendingQueue] = useState(initialQueue);
    const [formData, setFormData] = useState({
        type: attachment.extracted_data?.type || 'expense',
        supplier_name: attachment.extracted_data?.supplier?.name || '',
        supplier_tax_id: attachment.extracted_data?.supplier?.tax_id || '',
        supplier_tax_office: attachment.extracted_data?.supplier?.tax_office || '',
        supplier_email: attachment.extracted_data?.supplier?.email || '',
        supplier_address: attachment.extracted_data?.supplier?.address || '',
        supplier_city: attachment.extracted_data?.supplier?.city || '',
        supplier_country: attachment.extracted_data?.supplier?.country || '',
        supplier_postal_code: attachment.extracted_data?.supplier?.postal_code || '',
        supplier_phone: attachment.extracted_data?.supplier?.phone || '',
        supplier_mobile: attachment.extracted_data?.supplier?.mobile || '',
        invoice_number: attachment.extracted_data?.invoice_number || '',
        issue_date: attachment.extracted_data?.issue_date || new Date().toISOString().split('T')[0],
        due_date: attachment.extracted_data?.due_date || '',
        total_gross: attachment.extracted_data?.total_gross || 0,
        total_net: attachment.extracted_data?.total_net || 0,
        vat_percent: attachment.extracted_data?.vat_percent || 24,
        vat_amount: attachment.extracted_data?.vat_amount || 0,
        currency: attachment.extracted_data?.currency || 'EUR',
        status: attachment.extracted_data?.status || 'pending',
        description: attachment.extracted_data?.description || '',
        category_id: attachment.extracted_data?.category_id || '',
        items: attachment.extracted_data?.items || [],
    });

    // Poll for extraction completion
    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                router.reload({ only: ['attachment'], preserveState: true });
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [loading]);

    useEffect(() => {
        if (attachment.status === 'uploaded') {
            const intervalId = setInterval(async () => {
                try {
                    const response = await fetch(`/invoices/attachments/${attachment.id}/status`);
                    const data = await response.json();
                    if (data.status !== 'uploaded') {
                        setLoading(false);
                        clearInterval(intervalId);
                    }
                } catch (error) {
                    console.error('Error polling status:', error);
                    clearInterval(intervalId);
                    setLoading(false);
                }
            }, 2000);

            return () => clearInterval(intervalId);
        }
    }, [attachment.id, attachment.status]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const nextQueue = [...pendingQueue];
        const nextAttachmentId = nextQueue.shift();

        setLoading(true);

        router.post(route('invoices.store'), {
            attachment_id: attachment.id,
            ...formData,
        }, {
            preserveScroll: true,
            onError: () => setLoading(false),
            onSuccess: () => {
                setLoading(false);
                if (nextAttachmentId) {
                    setPendingQueue(nextQueue);
                    const query = nextQueue.length ? `?queue=${nextQueue.join(',')}` : '';
                    router.visit(`/invoices/extract/${nextAttachmentId}${query}`);
                } else {
                    router.visit('/invoices');
                }
            },
        });
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Extract Invoice Data With AI
                </h2>
            }
        >
            <Head title="Extract Invoice" />

            <div className="py-6">
                <div className="mx-auto max-w-full px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Form */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                        <p className="mt-4 text-gray-600">AI is extracting data from your invoice...</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {/* Type */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Set the invoice type
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('type', 'expense')}
                                                className={`px-4 py-2 rounded-md ${formData.type === 'expense' ? 'bg-red-100 text-red-700 border-red-500' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                Expense
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('type', 'income')}
                                                className={`px-4 py-2 rounded-md ${formData.type === 'income' ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                Income
                                            </button>
                                        </div>
                                    </div>

                                    {/* Counterparty */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formData.type === 'income' ? 'To (Customer)' : 'From (Supplier)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.supplier_name}
                                            onChange={(e) => handleChange('supplier_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formData.type === 'income' ? 'Customer Tax ID' : 'Tax ID'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.supplier_tax_id}
                                            onChange={(e) => handleChange('supplier_tax_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Invoice Number */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                                        <input
                                            type="text"
                                            value={formData.invoice_number}
                                            onChange={(e) => handleChange('invoice_number', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                        {serverErrors?.invoice_number && (
                                            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                                {serverErrors.invoice_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Total Amount */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.total_gross}
                                            onChange={(e) => handleChange('total_gross', parseFloat(e.target.value))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* VAT */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">VAT Percentage (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.vat_percent}
                                            onChange={(e) => handleChange('vat_percent', parseFloat(e.target.value))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Currency */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => handleChange('currency', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        >
                                            <option value="EUR">EUR (€)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>

                                    {/* Status */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Set the invoice status
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('status', 'pending')}
                                                className={`px-4 py-2 rounded-md ${formData.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                Pending
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('status', 'paid')}
                                                className={`px-4 py-2 rounded-md ${formData.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                Paid
                                            </button>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                        <select
                                            value={formData.category_id}
                                            onChange={(e) => handleChange('category_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        >
                                            <option value="">No category</option>
                                            {categories?.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Issue Date */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date</label>
                                        <input
                                            type="date"
                                            value={formData.issue_date}
                                            onChange={(e) => handleChange('issue_date', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => router.visit('/invoices')}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
                                        >
                                            Create Invoice
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Right: PDF Preview */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                                {attachment.original_name}
                            </h3>
                            <div className="border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                                <iframe
                                    src={`/attachments/${attachment.id}/preview`}
                                    className="w-full h-full"
                                    title="Invoice Preview"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
