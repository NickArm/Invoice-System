import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const formatCurrency = (value, currency = 'EUR') => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency }).format(value || 0);
};

const statusBadge = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
};

export default function Dashboard({ metrics, chartData = [], latestInvoices = [], period = 'this_month', periodOptions = [], analytics = {}, tab = 'overview', accountantEmails = [], exportDefaults = {} }) {
    const currency = metrics?.currency || 'EUR';
    const { flash = {} } = usePage().props || {};
    const sendForm = useForm({
        date_from: exportDefaults?.date_from || '',
        date_to: exportDefaults?.date_to || '',
        type: 'all',
    });
    const summaryCards = [
        {
            title: 'Total Income',
            value: formatCurrency(metrics?.income?.total || 0, currency),
            period: metrics?.period,
            breakdown: [
                `Received: ${formatCurrency(metrics?.income?.received || 0, currency)}`,
                `Pending: ${formatCurrency(metrics?.income?.pending || 0, currency)}`,
            ],
        },
        {
            title: 'Total Expenses',
            value: formatCurrency(metrics?.expenses?.total || 0, currency),
            period: metrics?.period,
            breakdown: [
                `Paid: ${formatCurrency(metrics?.expenses?.paid || 0, currency)}`,
                `Pending: ${formatCurrency(metrics?.expenses?.pending || 0, currency)}`,
            ],
        },
        {
            title: 'Net Profit',
            value: formatCurrency(metrics?.net_profit || 0, currency),
            period: metrics?.period,
            breakdown: [
                `Income: ${formatCurrency(metrics?.income?.total || 0, currency)}`,
                `Expenses: ${formatCurrency(metrics?.expenses?.total || 0, currency)}`,
            ],
        },
        {
            title: 'Pending Balance',
            value: formatCurrency(metrics?.pending_balance?.amount || 0, currency),
            period: metrics?.period,
            breakdown: [
                `To Receive: ${formatCurrency(metrics?.pending_balance?.to_receive || 0, currency)}`,
                `To Pay: ${formatCurrency(metrics?.pending_balance?.to_pay || 0, currency)}`,
            ],
        },
    ];

    const handlePeriodChange = (value) => {
        router.get(route('dashboard'), { period: value, tab }, { preserveState: true, replace: true });
    };

    const handleTabChange = (next) => {
        router.get(route('dashboard'), { period, tab: next }, { preserveState: true, replace: true });
    };

    const handleSendReport = (e) => {
        e.preventDefault();
        sendForm.post(route('accountant.send'), { preserveScroll: true });
    };

    const periodLabel = periodOptions.find((p) => p.value === period)?.label || metrics?.period || 'This Month';

    const topCustomers = analytics?.topCustomers || [];
    const topVendors = analytics?.topVendors || [];
    const entityStats = analytics?.entities || [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Business Statistics</h2>
                        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <button
                                type="button"
                                onClick={() => handleTabChange('overview')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === 'overview' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:text-primary-600 dark:text-gray-300'}`}
                            >
                                Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTabChange('analytics')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === 'analytics' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:text-primary-600 dark:text-gray-300'}`}
                            >
                                Analytics
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <select
                            value={period}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:border-primary-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                            {periodOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            {periodLabel}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {tab === 'overview' && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Send invoices to accountant</p>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Range export & email</h3>
                                    <p className="text-xs text-gray-500">Select a date range and we will email the summary and all attachments as a ZIP.</p>
                                </div>
                                {flash?.success && (
                                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700">
                                        {flash.success}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendReport} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <div className="space-y-1 lg:col-span-2">
                                    <label className="text-xs font-semibold text-gray-600">Date From</label>
                                    <input
                                        type="date"
                                        value={sendForm.data.date_from}
                                        onChange={(e) => sendForm.setData('date_from', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none"
                                    />
                                    {sendForm.errors.date_from && <p className="text-xs text-red-600">{sendForm.errors.date_from}</p>}
                                </div>

                                <div className="space-y-1 lg:col-span-2">
                                    <label className="text-xs font-semibold text-gray-600">Date To</label>
                                    <input
                                        type="date"
                                        value={sendForm.data.date_to}
                                        onChange={(e) => sendForm.setData('date_to', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none"
                                    />
                                    {sendForm.errors.date_to && <p className="text-xs text-red-600">{sendForm.errors.date_to}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Type</label>
                                    <select
                                        value={sendForm.data.type}
                                        onChange={(e) => sendForm.setData('type', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none"
                                    >
                                        <option value="all">All</option>
                                        <option value="income">Income</option>
                                        <option value="expense">Expenses</option>
                                    </select>
                                </div>

                                <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                        {accountantEmails.length === 0 && (
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                                                No recipients set. Add emails in Settings.
                                            </span>
                                        )}
                                        {accountantEmails.map((email) => (
                                            <span
                                                key={email}
                                                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 font-semibold text-primary-700"
                                            >
                                                {email}
                                            </span>
                                        ))}
                                        {sendForm.errors.emails && (
                                            <span className="text-red-600">{sendForm.errors.emails}</span>
                                        )}
                                    </div>

                                    <div className="ml-auto">
                                        <button
                                            type="submit"
                                            disabled={accountantEmails.length === 0 || sendForm.processing}
                                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:bg-gray-400"
                                        >
                                            {sendForm.processing ? 'Sending...' : 'Send to accountant'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map((card) => (
                                <div
                                    key={card.title}
                                    className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition hover:border-primary-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-primary-700"
                                >
                                    <div className="flex items-start justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <span>{card.title}</span>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            {card.period}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                        {card.value}
                                    </div>
                                    <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        {card.breakdown.map((line) => (
                                            <li key={line}>{line}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80 lg:col-span-2">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Financial Insights</h3>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                            <span className="h-2 w-2 rounded-full bg-primary-500" /> Income
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Expenses
                                            <span className="h-2 w-2 rounded-full bg-amber-500" /> Profit
                                        </div>
                                    </div>
                                </div>

                                <div className="h-72 rounded-lg border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-2 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900/50">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                            <defs>
                                                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                                                </linearGradient>
                                                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                                </linearGradient>
                                                <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value, currency)}
                                                labelStyle={{ color: '#111827', fontWeight: 600 }}
                                            />
                                            <Area type="monotone" dataKey="income" stroke="#6366f1" fill="url(#income)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="expense" stroke="#10b981" fill="url(#expense)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="profit" stroke="#f59e0b" fill="url(#profit)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    Showing last 12 months of activity
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Latest Invoices</h3>
                                    <div className="flex gap-1 text-xs text-gray-500 dark:text-gray-300">
                                        <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">Income</span>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">Expenses</span>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">Paid</span>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">Pending</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {latestInvoices.length === 0 && (
                                        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-300">
                                            No invoices yet.
                                        </div>
                                    )}
                                    {latestInvoices.map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 shadow-sm dark:border-gray-800"
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {invoice.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.date}</div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-gray-700 dark:text-gray-200">
                                                    {formatCurrency(invoice.amount, invoice.currency || currency)}
                                                </span>
                                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Entity Statistics</h3>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Period: {periodLabel}</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Business Entity</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Expenses</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Net</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pending Revenue</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pending Expenses</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue Invoices</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Expense Invoices</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {entityStats.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-3 py-3 text-sm text-gray-500 dark:text-gray-300">No data for this period.</td>
                                            </tr>
                                        )}
                                        {entityStats.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                                <td className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{row.entity}</td>
                                                <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">{formatCurrency(row.revenue, currency)}</td>
                                                <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">{formatCurrency(row.expenses, currency)}</td>
                                                <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">{formatCurrency(row.net, currency)}</td>
                                                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(row.pending_revenue, currency)}</td>
                                                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(row.pending_expenses, currency)}</td>
                                                <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{row.revenue_invoices}</td>
                                                <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{row.expense_invoices}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Customers by Revenue</h3>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Top 5</div>
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topCustomers} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis type="number" tickFormatter={(val) => formatCurrency(val, currency)} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                            <YAxis type="category" dataKey="entity" width={160} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                            <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                                            <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 4, 4]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Vendors by Expenses</h3>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Top 5</div>
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topVendors} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis type="number" tickFormatter={(val) => formatCurrency(val, currency)} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                            <YAxis type="category" dataKey="entity" width={160} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                            <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                                            <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 4, 4]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
