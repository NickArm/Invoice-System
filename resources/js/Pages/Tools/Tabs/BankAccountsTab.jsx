import React, { useState } from 'react';

export default function BankAccountsTab({ bankAccounts = [] }) {
    const [copied, setCopied] = useState(null);

    const formatAccountData = (account) => {
        const lines = [
            `${account.bank_name}`,
            `${account.iban}`,
        ];
        if (account.swift_bic) {
            lines.push(`${account.swift_bic}`);
        }
        return lines.join('\n');
    };

    const formatAllAccounts = () => {
        return bankAccounts
            .map((account) => {
                let text = `${account.bank_name}\n${account.iban}`;
                if (account.swift_bic) {
                    text += `\n${account.swift_bic}`;
                }
                return text;
            })
            .join('\n\n');
    };

    const handleCopyAccount = (account) => {
        const text = formatAccountData(account);
        navigator.clipboard.writeText(text);
        setCopied(account.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCopyAll = () => {
        const text = formatAllAccounts();
        navigator.clipboard.writeText(text);
        setCopied('all');
        setTimeout(() => setCopied(null), 2000);
    };

    if (bankAccounts.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 dark:text-slate-400">
                    No bank accounts found. Please add one in{' '}
                    <a href={route('settings.business-details')} className="text-blue-600 hover:underline">
                        Business Details
                    </a>
                    .
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Copy All Button */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleCopyAll}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                        copied === 'all'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                    }`}
                >
                    {copied === 'all' ? '✓ All Copied' : 'Copy All Accounts'}
                </button>
            </div>

            {/* Bank Accounts List */}
            {bankAccounts.map((account) => (
                <div
                    key={account.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-800 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-slate-400 w-20">Bank:</span>
                                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                                        {account.bank_name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-slate-400 w-20">IBAN:</span>
                                    <span className="font-mono text-sm text-gray-900 dark:text-slate-100 break-all">
                                        {account.iban}
                                    </span>
                                </div>
                                {account.swift_bic && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-slate-400 w-20">SWIFT:</span>
                                        <span className="font-mono text-sm text-gray-900 dark:text-slate-100">
                                            {account.swift_bic}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => handleCopyAccount(account)}
                            className={`px-4 py-2 text-sm rounded transition-colors whitespace-nowrap ${
                                copied === account.id
                                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                            }`}
                        >
                            {copied === account.id ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
