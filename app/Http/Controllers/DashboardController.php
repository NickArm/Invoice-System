<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $userId = auth()->id();
        $now = Carbon::now();
        $period = request('period', 'this_month');
        $tab = request('tab', 'overview');
        $range = $this->resolveRange($period, $now);
        $startLast12 = $now->copy()->subMonths(11)->startOfMonth();

        $userInvoices = Invoice::where('user_id', $userId)
            ->whereNotNull('issue_date');

        $periodQuery = clone $userInvoices;

        if ($range['start']) {
            $periodQuery->whereDate('issue_date', '>=', $range['start']);
        }
        if ($range['end']) {
            $periodQuery->whereDate('issue_date', '<=', $range['end']);
        }

        $periodAggregates = (clone $periodQuery)
            ->selectRaw('type')
            ->selectRaw('SUM(total_gross) as gross')
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN total_gross ELSE 0 END) as paid")
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN total_gross ELSE 0 END) as pending")
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        $incomeThis = (float) ($periodAggregates['income']->gross ?? 0);
        $incomeReceived = (float) ($periodAggregates['income']->paid ?? 0);
        $incomePending = (float) ($periodAggregates['income']->pending ?? 0);

        $expenseThis = (float) ($periodAggregates['expense']->gross ?? 0);
        $expensePaid = (float) ($periodAggregates['expense']->paid ?? 0);
        $expensePending = (float) ($periodAggregates['expense']->pending ?? 0);

        $latestInvoices = (clone $periodQuery)
            ->with('businessEntity')
            ->latest('issue_date')
            ->limit(5)
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'name' => $inv->businessEntity?->name ?? 'Unknown',
                'date' => optional($inv->issue_date)->format('d/m/Y'),
                'amount' => (float) $inv->total_gross,
                'currency' => $inv->currency,
                'status' => $inv->status,
                'type' => $inv->type,
            ]);

        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', issue_date)"
            : "DATE_FORMAT(issue_date, '%Y-%m')";

        $chartRaw = (clone $userInvoices)
            ->selectRaw("{$monthExpr} as ym")
            ->selectRaw("SUM(CASE WHEN type = 'income' THEN total_gross ELSE 0 END) as income")
            ->selectRaw("SUM(CASE WHEN type = 'expense' THEN total_gross ELSE 0 END) as expense")
            ->where('issue_date', '>=', $startLast12)
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        $months = collect(range(0, 11))->map(function ($i) use ($startLast12) {
            $month = $startLast12->copy()->addMonths($i);
            return [
                'ym' => $month->format('Y-m'),
                'label' => $month->format('M Y'),
            ];
        });

        $chartData = $months->map(function (array $month) use ($chartRaw) {
            $row = $chartRaw->get($month['ym']);
            $income = $row?->income ?? 0;
            $expense = $row?->expense ?? 0;
            return [
                'label' => $month['label'],
                'income' => (float) $income,
                'expense' => (float) $expense,
                'profit' => (float) ($income - $expense),
            ];
        });

        $metrics = [
            'period' => $range['label'],
            'income' => [
                'total' => $incomeThis,
                'received' => $incomeReceived,
                'pending' => $incomePending,
            ],
            'expenses' => [
                'total' => $expenseThis,
                'paid' => $expensePaid,
                'pending' => $expensePending,
            ],
            'net_profit' => (float) ($incomeThis - $expenseThis),
            'pending_balance' => [
                'amount' => (float) ($incomePending - $expensePending),
                'to_receive' => $incomePending,
                'to_pay' => $expensePending,
            ],
            'totals' => [
                'invoice_count' => (clone $periodQuery)->count(),
                'invoice_sum' => (float) (clone $periodQuery)->sum('total_gross'),
            ],
            'currency' => 'EUR',
        ];

        $analytics = $this->buildAnalytics($periodQuery);

        return Inertia::render('Dashboard', [
            'metrics' => $metrics,
            'chartData' => $chartData,
            'latestInvoices' => $latestInvoices,
            'period' => $period,
            'periodOptions' => $this->periodOptions(),
            'analytics' => $analytics,
            'tab' => $tab,
            'accountantEmails' => collect(auth()->user()->accountant_emails ?? [])->filter()->values(),
            'exportDefaults' => [
                'date_from' => $now->copy()->startOfMonth()->format('Y-m-d'),
                'date_to' => $now->format('Y-m-d'),
            ],
        ]);
    }

    private function resolveRange(string $period, Carbon $now): array
    {
        return match ($period) {
            'last_month' => [
                'start' => $now->copy()->subMonthNoOverflow()->startOfMonth(),
                'end' => $now->copy()->subMonthNoOverflow()->endOfMonth(),
                'label' => $now->copy()->subMonthNoOverflow()->format('F Y'),
            ],
            'this_quarter' => [
                'start' => $now->copy()->firstOfQuarter(),
                'end' => $now->copy()->lastOfQuarter(),
                'label' => 'This Quarter',
            ],
            'last_quarter' => [
                'start' => $now->copy()->subQuarter()->firstOfQuarter(),
                'end' => $now->copy()->subQuarter()->lastOfQuarter(),
                'label' => 'Last Quarter',
            ],
            'this_year' => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
                'label' => $now->copy()->format('Y'),
            ],
            'last_year' => [
                'start' => $now->copy()->subYear()->startOfYear(),
                'end' => $now->copy()->subYear()->endOfYear(),
                'label' => $now->copy()->subYear()->format('Y'),
            ],
            'all_time' => [
                'start' => null,
                'end' => null,
                'label' => 'All Time',
            ],
            default => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
                'label' => $now->copy()->format('F Y'),
            ],
        };
    }

    private function periodOptions(): array
    {
        return [
            ['value' => 'this_month', 'label' => 'This Month'],
            ['value' => 'last_month', 'label' => 'Last Month'],
            ['value' => 'this_quarter', 'label' => 'This Quarter'],
            ['value' => 'last_quarter', 'label' => 'Last Quarter'],
            ['value' => 'this_year', 'label' => 'This Year'],
            ['value' => 'last_year', 'label' => 'Last Year'],
            ['value' => 'all_time', 'label' => 'All Time'],
        ];
    }

    private function buildAnalytics($baseQuery): array
    {
        $entityStats = (clone $baseQuery)
            ->selectRaw('business_entity_id')
            ->selectRaw("SUM(CASE WHEN type='income' THEN total_gross ELSE 0 END) as revenue")
            ->selectRaw("SUM(CASE WHEN type='expense' THEN total_gross ELSE 0 END) as expenses")
            ->selectRaw("SUM(CASE WHEN type='income' AND status='pending' THEN total_gross ELSE 0 END) as pending_revenue")
            ->selectRaw("SUM(CASE WHEN type='expense' AND status='pending' THEN total_gross ELSE 0 END) as pending_expenses")
            ->selectRaw('COUNT(CASE WHEN type = "income" THEN 1 END) as revenue_invoices')
            ->selectRaw('COUNT(CASE WHEN type = "expense" THEN 1 END) as expense_invoices')
            ->with('businessEntity:id,name')
            ->groupBy('business_entity_id')
            ->orderByDesc('revenue')
            ->limit(25)
            ->get()
            ->map(fn ($row) => [
                'entity' => $row->businessEntity?->name ?? 'Unknown',
                'revenue' => (float) $row->revenue,
                'expenses' => (float) $row->expenses,
                'net' => (float) ($row->revenue - $row->expenses),
                'pending_revenue' => (float) $row->pending_revenue,
                'pending_expenses' => (float) $row->pending_expenses,
                'revenue_invoices' => (int) $row->revenue_invoices,
                'expense_invoices' => (int) $row->expense_invoices,
            ]);

        $topCustomers = $entityStats
            ->sortByDesc('revenue')
            ->take(5)
            ->values();

        $topVendors = $entityStats
            ->sortByDesc('expenses')
            ->take(5)
            ->values();

        return [
            'entities' => $entityStats,
            'topCustomers' => $topCustomers,
            'topVendors' => $topVendors,
        ];
    }
}
