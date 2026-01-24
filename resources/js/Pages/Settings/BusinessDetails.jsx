import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BankAccountsManager from '@/Components/BankAccountsManager';

export default function BusinessDetails({ company, bankAccounts }) {
    const { data, setData, post, processing, errors } = useForm({
        name: company?.name || '',
        tax_id: company?.tax_id || '',
        email: company?.email || '',
        country: company?.country || '',
        city: company?.city || '',
        postal_code: company?.postal_code || '',
        tax_office: company?.tax_office || '',
        address: company?.address || '',
        phone: company?.phone || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.business-details.update'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Business Details" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg dark:bg-slate-900">
                        <div className="px-4 py-6 sm:px-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                                Business Details
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Tax ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Tax ID (ΑΦΜ) *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.tax_id}
                                        onChange={(e) => setData('tax_id', e.target.value)}
                                        placeholder="e.g., 1234567890"
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.tax_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.tax_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                        This helps AI extract supplier information from invoices
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* Country */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Country *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        placeholder="e.g., GR"
                                        maxLength="2"
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.country ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.country && (
                                        <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                                    )}
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.city ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.city && (
                                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                    )}
                                </div>

                                {/* Postal Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.postal_code ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.postal_code && (
                                        <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.address ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>

                                {/* Tax Office */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Tax Office
                                    </label>
                                    <input
                                        type="text"
                                        value={data.tax_office}
                                        onChange={(e) => setData('tax_office', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.tax_office ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.tax_office && (
                                        <p className="mt-1 text-sm text-red-600">{errors.tax_office}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 ${
                                            errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {processing ? 'Saving...' : 'Save Business Details'}
                                    </button>
                                </div>
                            </form>

                            {/* Bank Accounts Manager */}
                            {company && (
                                <BankAccountsManager
                                    bankAccounts={bankAccounts || []}
                                    companyId={company.id}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
