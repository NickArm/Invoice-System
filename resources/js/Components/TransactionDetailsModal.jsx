import React from 'react';
import { formatCurrency, formatDate } from '@/Utils/formatting';
import SimpleBottomSheet from '@/Components/SimpleBottomSheet';

export default function TransactionDetailsModal({ isOpen, transaction, onClose, isLoading = false, error = null }) {
    if (!isOpen || !transaction) return null;

    const details = transaction.details || {};
    const counterpartInfo = transaction.counterpartInfo;
    const hasDetails = details && details.mark;

    return (
        <SimpleBottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={`Transaction Details`}
            fullHeight={false}
        >
            {/* Loading state */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !error && hasDetails && (
                <div className="space-y-4">
                    {/* Summary Row */}
                    <div className="grid grid-cols-3 gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
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
                    {details.lineItems && details.lineItems.length > 0 && (
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

            {!isLoading && !error && !hasDetails && (
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No detailed information available</p>
                </div>
            )}
        </SimpleBottomSheet>
    );
}
