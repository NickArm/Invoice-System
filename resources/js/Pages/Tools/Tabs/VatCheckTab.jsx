import React, { useState } from 'react';
import axios from 'axios';

export default function VatCheckTab() {
    const [taxId, setTaxId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(route('tools.validate-tax-id'), {
                tax_id: taxId,
            });
            setResult(response.data);
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.errors?.tax_id) {
                setError(err.response.data.errors.tax_id);
            } else {
                setError('An error occurred while validating the tax ID.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                        Tax ID (ΑΦΜ) *
                    </label>
                    <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="e.g., 123456789"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !taxId.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                    {loading ? 'Validating...' : 'Validate Tax ID'}
                </button>
            </form>

            {/* Result */}
            {result && (
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-800">
                    {result.success ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                    ✓ Tax ID is valid
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                        Company Name
                                    </p>
                                    <p className="font-semibold text-gray-900 dark:text-slate-100">
                                        {result.data.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                        Tax ID
                                    </p>
                                    <p className="font-mono text-gray-900 dark:text-slate-100">
                                        {result.data.tax_id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                        Tax Office (ΔΟΥ)
                                    </p>
                                    <p className="text-gray-900 dark:text-slate-100">
                                        {result.data.doy}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                        Status
                                    </p>
                                    <p className="text-gray-900 dark:text-slate-100">
                                        {result.data.status}
                                    </p>
                                </div>

                                {result.data.address && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                            Address
                                        </p>
                                        <p className="text-gray-900 dark:text-slate-100">
                                            {result.data.address}
                                        </p>
                                    </div>
                                )}

                                {result.data.city && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                            City
                                        </p>
                                        <p className="text-gray-900 dark:text-slate-100">
                                            {result.data.city}
                                        </p>
                                    </div>
                                )}

                                {result.data.postal_code && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                            Postal Code
                                        </p>
                                        <p className="text-gray-900 dark:text-slate-100">
                                            {result.data.postal_code}
                                        </p>
                                    </div>
                                )}

                                {result.data.activity && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                            Activity
                                        </p>
                                        <p className="text-gray-900 dark:text-slate-100">
                                            {result.data.activity}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                                        Active
                                    </p>
                                    <p className={`font-medium ${result.data.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {result.data.is_active ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                ✗ {result.message}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
