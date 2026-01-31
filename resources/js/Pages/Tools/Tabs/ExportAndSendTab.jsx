import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/formatting';

export default function ExportAndSendTab({ accountantEmails = [] }) {
    const { flash = {} } = usePage().props || {};
    const sendForm = useForm({
        date_from: '',
        date_to: '',
        type: 'all',
    });

    const handleSendReport = (e) => {
        e.preventDefault();
        sendForm.post(route('accountant.send'), { preserveScroll: true });
    };

    return (
        <div>
            {flash?.success && (
                <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    ✓ {flash.success}
                </div>
            )}

            <form onSubmit={handleSendReport} className="space-y-6 mb-8">
                {/* Date Range Section */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                            Date From *
                        </label>
                        <input
                            type="date"
                            value={sendForm.data.date_from}
                            onChange={(e) => sendForm.setData('date_from', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {sendForm.errors.date_from && (
                            <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.date_from}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                            Date To *
                        </label>
                        <input
                            type="date"
                            value={sendForm.data.date_to}
                            onChange={(e) => sendForm.setData('date_to', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {sendForm.errors.date_to && (
                            <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.date_to}</p>
                        )}
                    </div>
                </div>

                {/* Invoice Type Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Invoice Type *
                    </label>
                    <select
                        value={sendForm.data.type}
                        onChange={(e) => sendForm.setData('type', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Invoices</option>
                        <option value="income">Income Only</option>
                        <option value="expense">Expenses Only</option>
                    </select>
                    {sendForm.errors.type && (
                        <p className="text-xs text-red-600 dark:text-red-400">{sendForm.errors.type}</p>
                    )}
                </div>

                {/* Recipients Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Recipients
                    </label>
                    <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 p-4">
                        {accountantEmails.length === 0 ? (
                            <div className="text-center py-3">
                                <p className="text-sm text-amber-700 dark:text-amber-400">No recipients configured.</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Please add email addresses in{' '}
                                    <a
                                        href={route('settings.accountant-emails')}
                                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                        Settings → Accountant Emails
                                    </a>
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {accountantEmails.map((email) => (
                                    <span
                                        key={email}
                                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button
                        type="submit"
                        disabled={accountantEmails.length === 0 || sendForm.processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-6 py-2 font-semibold text-white shadow-sm transition dark:bg-blue-600 dark:hover:bg-blue-700"
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

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-900 dark:text-blue-300">
                <p className="font-semibold mb-2">📋 How it works</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Select the date range and invoice type you want to export</li>
                    <li>All invoices matching your criteria will be attached as a ZIP file</li>
                    <li>A summary of income, expenses, and net profit will be included</li>
                    <li>Email will be sent to all configured recipient addresses</li>
                </ul>
            </div>
        </div>
    );
}
