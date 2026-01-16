import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

const formatCurrency = (value, currency = 'EUR') => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency }).format(value || 0);
};

export default function ExportAndSend({ accountantEmails = [], exportDefaults = {} }) {
    const { flash = {} } = usePage().props || {};
    const sendForm = useForm({
        date_from: exportDefaults?.date_from || '',
        date_to: exportDefaults?.date_to || '',
        type: 'all',
    });

    const handleSendReport = (e) => {
        e.preventDefault();
        sendForm.post(route('accountant.send'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">Export & Send</h2>}
        >
            <Head title="Export & Send" />

            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Send invoices to accountant</p>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Range export & email</h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Select a date range and invoice type. We will email the summary and all attachments as a ZIP file to your configured accountant email addresses.
                            </p>
                        </div>
                        {flash?.success && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                ✓ {flash.success}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendReport} className="mt-6 space-y-6">
                        {/* Date Range Section */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date From</label>
                                <input
                                    type="date"
                                    value={sendForm.data.date_from}
                                    onChange={(e) => sendForm.setData('date_from', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                                />
                                {sendForm.errors.date_from && <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.date_from}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date To</label>
                                <input
                                    type="date"
                                    value={sendForm.data.date_to}
                                    onChange={(e) => sendForm.setData('date_to', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                                />
                                {sendForm.errors.date_to && <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.date_to}</p>}
                            </div>
                        </div>

                        {/* Invoice Type Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice Type</label>
                            <select
                                value={sendForm.data.type}
                                onChange={(e) => sendForm.setData('type', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                                <option value="all">All Invoices</option>
                                <option value="income">Income Only</option>
                                <option value="expense">Expenses Only</option>
                            </select>
                            {sendForm.errors.type && <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.type}</p>}
                        </div>

                        {/* Recipients Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Recipients</label>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                                {accountantEmails.length === 0 ? (
                                    <div className="text-center py-3">
                                        <p className="text-sm text-amber-700 dark:text-amber-400">No recipients configured.</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            Please add email addresses in <a href={route('settings.accountant-emails')} className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Settings</a>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {accountantEmails.map((email) => (
                                            <span
                                                key={email}
                                                className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                            >
                                                <span className="h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-400" />
                                                {email}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {sendForm.errors.emails && (
                                <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.emails}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={accountantEmails.length === 0 || sendForm.processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-primary-600 dark:hover:bg-primary-700"
                            >
                                {sendForm.processing ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span>📧</span>
                                        Send to Accountant
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300">
                    <p className="font-semibold mb-2">📋 How it works</p>
                    <ul className="space-y-1 text-xs list-disc list-inside">
                        <li>Select the date range and invoice type you want to export</li>
                        <li>All invoices matching your criteria will be attached as a ZIP file</li>
                        <li>A summary of income, expenses, and net profit will be included</li>
                        <li>Email will be sent to all configured recipient addresses</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
