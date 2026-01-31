import React, { useState } from 'react';
import { formatCurrency, formatDate } from '@/Utils/formatting';

export default function MyAADETab({ mydataCredentials }) {
    const [type, setType] = useState('income');
    const [dateFrom, setDateFrom] = useState(
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    );
    const [dateTo, setDateTo] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [totals, setTotals] = useState({
        netValue: 0,
        vatAmount: 0,
        grossValue: 0,
        count: 0,
    });

    const handleFetch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Convert date format from YYYY-MM-DD to DD/MM/YYYY
            const fromFormatted = dateFrom.split('-').reverse().join('/');
            const toFormatted = dateTo.split('-').reverse().join('/');

            const response = await fetch('/tools/myaade/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    type,
                    date_from: fromFormatted,
                    date_to: toFormatted,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || 'Failed to fetch data');
                setData([]);
                setTotals({ netValue: 0, vatAmount: 0, grossValue: 0, count: 0 });
                return;
            }

            setData(result.data || []);

            // Calculate totals
            if (result.data && result.data.length > 0) {
                const totaled = result.data.reduce((acc, item) => ({
                    netValue: acc.netValue + (item.netValue || 0),
                    vatAmount: acc.vatAmount + (item.vatAmount || 0),
                    grossValue: acc.grossValue + (item.grossValue || 0),
                    count: acc.count + (item.count || 0),
                }), { netValue: 0, vatAmount: 0, grossValue: 0, count: 0 });
                setTotals(totaled);
            } else {
                setTotals({ netValue: 0, vatAmount: 0, grossValue: 0, count: 0 });
            }
        } catch (err) {
            setError('Error: ' + err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    if (!mydataCredentials?.subscriptionKey || !mydataCredentials?.username) {
        return (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
                <h3 className="text-amber-900 dark:text-amber-100 font-semibold mb-2">
                    myDATA Credentials Missing
                </h3>
                <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
                    Please configure your myDATA credentials in Settings to use this feature.
                </p>
                <a href="/settings/aade" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Go to AADE Settings →
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <form onSubmit={handleFetch} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Type Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Document Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    type === 'income'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('expenses')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    type === 'expenses'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                Expenses
                            </button>
                        </div>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Fetch Button */}
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? 'Loading...' : 'Fetch Data'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
            )}

            {/* Results */}
            {data.length > 0 && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Total Net</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                                {formatCurrency(totals.netValue)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Total VAT</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                                {formatCurrency(totals.vatAmount)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Total Gross</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                                {formatCurrency(totals.grossValue)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Records</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                                {totals.count}
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-slate-100">
                                        Uploaded
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-slate-100">
                                        VAT Number
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-slate-100">
                                        Issue Date
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-slate-100">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-slate-100">
                                        Net
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-slate-100">
                                        VAT
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-slate-100">
                                        Gross
                                    </th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-slate-100">
                                        Count
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-center">
                                            {item.uploaded ? (
                                                <a
                                                    href={`/invoices/${item.invoice_id}/edit`}
                                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                                                    title="View uploaded invoice"
                                                >
                                                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700">
                                                    <span className="text-xs text-gray-400">-</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-slate-100">
                                            <span className="font-medium">{item.counterVatNumber}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                                            {formatDate(item.issueDate)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                                            {item.invType}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-slate-100">
                                            {formatCurrency(item.netValue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-slate-100">
                                            {formatCurrency(item.vatAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-slate-100 font-semibold">
                                            {formatCurrency(item.grossValue)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600 dark:text-slate-300">
                                            {item.count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Empty State */}
            {!loading && data.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                    <p>No data found. Set your filters and click "Fetch Data" to get started.</p>
                </div>
            )}
        </div>
    );
}
