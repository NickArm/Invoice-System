import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Alert from '@/Components/Alert';
import Checkbox from '@/Components/Checkbox';

export default function AadeSettings({ settings }) {
    const [testResult, setTestResult] = useState(null);
    const [validateResult, setValidateResult] = useState(null);
    const [testTaxId, setTestTaxId] = useState('');
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        // VAT Registry (for tax ID validation)
        vat_registry_username: settings.vat_registry_username || '',
        vat_registry_password: settings.vat_registry_password || '',

        // AADE myDATA (for invoices)
        aade_username: settings.aade_username || '',
        aade_password: '',
        mydata_subscription_key: settings.mydata_subscription_key || '',
        aade_enabled: settings.aade_enabled || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.aade.update'), {
            onSuccess: () => {
                setTestResult(null);
                setValidateResult(null);
            },
        });
    };

    const handleTestConnection = async (e) => {
        e.preventDefault();

        if ((!data.vat_registry_username || !data.vat_registry_password) &&
            (!data.aade_username || !data.mydata_subscription_key)) {
            setTestResult({
                success: false,
                message: 'Please fill in credentials for at least one service'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(route('settings.aade.test-connection'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    vat_registry_username: data.vat_registry_username,
                    vat_registry_password: data.vat_registry_password,
                    aade_username: data.aade_username,
                    mydata_subscription_key: data.mydata_subscription_key,
                }),
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Connection test failed: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleValidateTaxId = async (e) => {
        e.preventDefault();

        if (!testTaxId.trim()) {
            setValidateResult({
                success: false,
                message: 'Please enter a tax ID (ΑΦΜ)'
            });
            return;
        }

        if (!data.vat_registry_username || !data.vat_registry_password) {
            setValidateResult({
                success: false,
                message: 'Please fill in VAT Registry credentials first'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(route('settings.aade.validate-tax-id'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    tax_id: testTaxId,
                    vat_registry_username: data.vat_registry_username,
                    vat_registry_password: data.vat_registry_password,
                }),
            });

            const result = await response.json();
            setValidateResult(result);
        } catch (error) {
            setValidateResult({
                success: false,
                message: 'Validation failed: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="AADE Settings" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                AADE Integration Settings
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Configure credentials for VAT Registry (tax validation) and AADE myDATA (invoices)
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Enable/Disable Toggle */}
                            <div>
                                <label className="flex items-center space-x-3">
                                    <Checkbox
                                        checked={data.aade_enabled}
                                        onChange={(e) => setData('aade_enabled', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Enable AADE Integration
                                    </span>
                                </label>
                            </div>

                            {data.aade_enabled && (
                                <>
                                    {/* VAT Registry Section */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            VAT Registry (Tax ID Validation)
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Credentials from VAT Registry service for validating Greek tax IDs (ΑΦΜ)
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel htmlFor="vat_registry_username" value="VAT Registry Username" />
                                                <TextInput
                                                    id="vat_registry_username"
                                                    type="text"
                                                    value={data.vat_registry_username}
                                                    onChange={(e) => setData('vat_registry_username', e.target.value)}
                                                    className="mt-1 block w-full"
                                                    placeholder="Your VAT Registry username"
                                                />
                                                {errors.vat_registry_username && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.vat_registry_username}</p>
                                                )}
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="vat_registry_password" value="VAT Registry Password" />
                                                <TextInput
                                                    id="vat_registry_password"
                                                    type="text"
                                                    value={data.vat_registry_password}
                                                    onChange={(e) => setData('vat_registry_password', e.target.value)}
                                                    className="mt-1 block w-full"
                                                    placeholder="Your VAT Registry password"
                                                />
                                                {errors.vat_registry_password && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.vat_registry_password}</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Leave empty to keep current password
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AADE myDATA Section */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            AADE myDATA (Invoice Submissions)
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Credentials from myDATA portal for invoice submissions and data retrieval
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel htmlFor="aade_username" value="myDATA Username" />
                                                <TextInput
                                                    id="aade_username"
                                                    type="text"
                                                    value={data.aade_username}
                                                    onChange={(e) => setData('aade_username', e.target.value)}
                                                    className="mt-1 block w-full"
                                                    placeholder="Your myDATA username"
                                                />
                                                {errors.aade_username && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.aade_username}</p>
                                                )}
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="mydata_subscription_key" value="Subscription Key" />
                                                <TextInput
                                                    id="mydata_subscription_key"
                                                    type="text"
                                                    value={data.mydata_subscription_key}
                                                    onChange={(e) => setData('mydata_subscription_key', e.target.value)}
                                                    className="mt-1 block w-full"
                                                    placeholder="Your myDATA subscription key"
                                                />
                                                {errors.mydata_subscription_key && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.mydata_subscription_key}</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Find this in your myDATA portal subscriptions
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Section */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Test Connections
                                        </h3>

                                        {/* Connection Test */}
                                        <div className="mb-6">
                                            <button
                                                type="button"
                                                onClick={handleTestConnection}
                                                disabled={loading}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {loading ? 'Testing...' : 'Test Connections'}
                                            </button>
                                            {testResult && testResult.results && (
                                                <div className="mt-4 space-y-2">
                                                    {testResult.results.vat_registry && (
                                                        <Alert
                                                            type={testResult.results.vat_registry.success ? 'success' : 'error'}
                                                            message={`VAT Registry: ${testResult.results.vat_registry.message}`}
                                                        />
                                                    )}
                                                    {testResult.results.mydata && (
                                                        <Alert
                                                            type={testResult.results.mydata.success ? 'success' : 'error'}
                                                            message={`myDATA: ${testResult.results.mydata.message}`}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {testResult && !testResult.success && !testResult.results && (
                                                <Alert
                                                    type="error"
                                                    message={testResult.message}
                                                    className="mt-4"
                                                />
                                            )}
                                        </div>

                                        {/* Tax ID Validation Test */}
                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel htmlFor="test_tax_id" value="Test Tax ID (ΑΦΜ) Validation" />
                                                <TextInput
                                                    id="test_tax_id"
                                                    type="text"
                                                    value={testTaxId}
                                                    onChange={(e) => setTestTaxId(e.target.value)}
                                                    className="mt-1 block w-full"
                                                    placeholder="e.g., 123456789"
                                                    maxLength="20"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Enter a Greek tax ID (ΑΦΜ) to validate using VAT Registry
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleValidateTaxId}
                                                disabled={loading}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {loading ? 'Validating...' : 'Validate Tax ID'}
                                            </button>
                                            {validateResult && (
                                                <div className={`p-4 rounded-lg ${
                                                    validateResult.success
                                                        ? 'bg-green-50 border border-green-200'
                                                        : 'bg-red-50 border border-red-200'
                                                }`}>
                                                    <p className={`text-sm font-semibold ${
                                                        validateResult.success
                                                            ? 'text-green-700'
                                                            : 'text-red-700'
                                                    }`}>
                                                        {validateResult.message}
                                                    </p>
                                                    {validateResult.success && validateResult.data && (
                                                        <div className="mt-4 space-y-2">
                                                            {validateResult.data.name && (
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-gray-700">Name: </span>
                                                                    <span className="text-gray-600">{validateResult.data.name}</span>
                                                                </div>
                                                            )}
                                                            {validateResult.data.doy && (
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-gray-700">Tax Office: </span>
                                                                    <span className="text-gray-600">{validateResult.data.doy}</span>
                                                                </div>
                                                            )}
                                                            {validateResult.data.status && (
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-gray-700">Status: </span>
                                                                    <span className="text-gray-600">{validateResult.data.status}</span>
                                                                </div>
                                                            )}
                                                            {validateResult.data.activity && (
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-gray-700">Activity: </span>
                                                                    <span className="text-gray-600">{validateResult.data.activity}</span>
                                                                </div>
                                                            )}
                                                            {validateResult.data.address && (
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-gray-700">Address: </span>
                                                                    <span className="text-gray-600">{validateResult.data.address}</span>
                                                                </div>
                                                            )}
                                                            {validateResult.data.postal_code && (
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-gray-700">Postal Code: </span>
                                                                    <span className="text-gray-600">{validateResult.data.postal_code}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Settings'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
