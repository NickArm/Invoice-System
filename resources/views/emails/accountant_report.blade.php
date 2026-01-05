<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice Export</title>
    <style>
        body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; }
        .message { margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-left: 4px solid #6366f1; }
        .summary { margin-top: 12px; }
        .summary table { border-collapse: collapse; width: 100%; }
        .summary td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; }
        .muted { color: #6b7280; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Invoice Export</h2>
        <p class="muted">Range: {{ $dateFrom->format('d/m/Y') }} - {{ $dateTo->format('d/m/Y') }} ({{ $type === 'all' ? 'All' : ucfirst($type) }})</p>

        @if($userMessage)
            <div class="message">
                {!! nl2br(e((string) $userMessage)) !!}
            </div>
        @endif

        <div class="summary">
            <table>
                <tr>
                    <td>Total invoices</td>
                    <td>{{ $summary['total_count'] }}</td>
                </tr>
                <tr>
                    <td>Income (count / amount)</td>
                    <td>{{ $summary['income_count'] }} / {{ number_format($summary['income_sum'], 2) }}</td>
                </tr>
                <tr>
                    <td>Expenses (count / amount)</td>
                    <td>{{ $summary['expense_count'] }} / {{ number_format($summary['expense_sum'], 2) }}</td>
                </tr>
                <tr>
                    <td>Net</td>
                    <td>{{ number_format($summary['net'], 2) }}</td>
                </tr>
                <tr>
                    <td>Attachments</td>
                    <td>{{ $attachmentsCount }}</td>
                </tr>
            </table>
        </div>

        <p class="muted" style="margin-top: 16px;">Sender: {{ $user->name }} ({{ $user->email }})</p>

        <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">This email was generated automatically from your invoice system.</p>
    </div>
</body>
</html>
