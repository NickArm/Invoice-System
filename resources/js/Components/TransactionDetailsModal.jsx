import React from 'react';
import { formatCurrency, formatDate } from '@/Utils/formatting';

export default function TransactionDetailsModal({ isOpen, transaction, onClose, isLoading = false, error = null }) {
    if (!isOpen || !transaction) return null;

    const details = transaction.details || {};
    const counterpartInfo = transaction.counterpartInfo;
    const hasDetails = details && details.mark;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal - Centered both vertically and horizontally */}
            <div className="flex items-center justify-center min-h-screen px-4">
                <div
                    className="relative bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full sm:max-w-2xl"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 sm:px-6 sm:py-4 border-b border-blue-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-white" id="modal-headline">
                                    Transaction Details
                                </h3>
                                {transaction.counterVatNumber && (
                                    <p className="mt-1 text-sm text-blue-100">VAT: {transaction.counterVatNumber} · {formatDate(transaction.issueDate)}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-blue-100 focus:outline-none transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                        {isLoading && (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        {!isLoading && !error && (
                            <div className="space-y-4">
                                {/* Notice if no detailed data */}
                                {!hasDetails && (
                                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                            Detailed line items are not available from myDATA API.
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                                            Showing aggregated summary data:
                                        </p>
                                    </div>
                                )}

                                {/* Summary Row */}
                                <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Net Amount</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(transaction.netValue || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">VAT</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(transaction.vatAmount || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Total</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(transaction.grossValue || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Transaction Data */}
                                <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700">
                                        <span className="font-semibold text-slate-900 dark:text-white">Transaction Data</span>
                                    </div>
                                    <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-600 space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">Counterparty VAT</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{transaction.counterVatNumber || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">Issue Date</p>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {transaction.issueDate ? formatDate(transaction.issueDate) : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">Invoice Type</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{transaction.invType || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">Record Count</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{transaction.count || '-'}</p>
                                            </div>
                                        </div>

                                        {/* Additional charges if any */}
                                        {(transaction.withheldAmount || transaction.otherTaxesAmount || transaction.stampDutyAmount || transaction.feesAmount || transaction.deductionsAmount || transaction.thirdPartyAmount) && (
                                            <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                                                <p className="font-semibold text-slate-900 dark:text-white mb-2">Additional Charges & Deductions</p>
                                                <div className="space-y-1">
                                                    {transaction.stampDutyAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Stamp Duty</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {formatCurrency(transaction.stampDutyAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {transaction.withheldAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Withheld Amount</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {formatCurrency(transaction.withheldAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {transaction.otherTaxesAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Other Taxes</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {formatCurrency(transaction.otherTaxesAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {transaction.feesAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Fees</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {formatCurrency(transaction.feesAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {transaction.deductionsAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Deductions</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {formatCurrency(transaction.deductionsAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {transaction.thirdPartyAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Third Party</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {formatCurrency(transaction.thirdPartyAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Line Items (if available) */}
                                {hasDetails && details.lineItems && details.lineItems.length > 0 && (
                                    <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700">
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                Line Items ({details.lineItems.length})
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-600">
                                            <div className="space-y-4">
                                                {details.lineItems.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="pb-4 border-b border-slate-200 dark:border-slate-600 last:border-b-0 last:pb-0 text-sm"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-white">
                                                                    {item.description || `Line Item ${item.lineNumber}`}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {item.quantity} {item.unitOfMeasurement || 'units'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                                    {formatCurrency(item.grossAmount || 0)}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    @{formatCurrency(item.unitPrice || 0)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div>
                                                                <p className="text-slate-600 dark:text-slate-400">Net</p>
                                                                <p className="font-medium text-slate-900 dark:text-white">
                                                                    {formatCurrency(item.netAmount || 0)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-600 dark:text-slate-400">VAT ({item.vatCategory})</p>
                                                                <p className="font-medium text-slate-900 dark:text-white">
                                                                    {formatCurrency(item.vatAmount || 0)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-600 dark:text-slate-400">Discount</p>
                                                                <p className="font-medium text-slate-900 dark:text-white">
                                                                    {formatCurrency(item.discountAmount || 0)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Counterpart Company Info (if available) */}
                                {counterpartInfo && (
                                    <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700">
                                            <span className="font-semibold text-slate-900 dark:text-white">Counterparty Company Details</span>
                                        </div>
                                        <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-600 space-y-3 text-sm">
                                            {(counterpartInfo.company_name || counterpartInfo.name) && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Company Name</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.company_name || counterpartInfo.name}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.tax_id && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Tax ID</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.tax_id}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.tax_office && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Tax Office</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.tax_office}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.status && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Status</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.status}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.address && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Address</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.address}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.city && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">City</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.city}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.postal_code && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Postal Code</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.postal_code}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.activity && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Activity</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{counterpartInfo.activity}</p>
                                                </div>
                                            )}
                                            {counterpartInfo.active !== undefined && (
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Active</p>
                                                    <p className={`font-medium ${counterpartInfo.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {counterpartInfo.active ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-600 flex justify-end">
                        <button
                            onClick={onClose}
                            className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
