import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsNav from '@/Components/SettingsNav';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/TextArea';
import PrimaryButton from '@/Components/PrimaryButton';
import Alert from '@/Components/Alert';
import Checkbox from '@/Components/Checkbox';

export default function AadeSettings({ settings }) {
    const [testResult, setTestResult] = useState(null);
    const [validateResult, setValidateResult] = useState(null);
    const [testTaxId, setTestTaxId] = useState('');
    const [loading, setLoading] = useState(false);
    const [certificateFile, setCertificateFile] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        aade_username: settings.aade_username || '',
        aade_password: '',
        aade_certificate: '',
        aade_enabled: settings.aade_enabled || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.aade.update'), {
            onSuccess: () => setTestResult(null),
        });
    };

    const handleTestConnection = async (e) => {
        e.preventDefault();
        
        if (!data.aade_username || !data.aade_password || !data.aade_certificate) {
            setTestResult({
                success: false,
                message: 'Please fill in all AADE credentials first'
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
                    aade_username: data.aade_username,
                    aade_password: data.aade_password,
                    aade_certificate: data.aade_certificate,
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

        if (!data.aade_username || !data.aade_password || !data.aade_certificate) {
            setValidateResult({
                success: false,
                message: 'Please fill in all AADE credentials first'
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
                    aade_username: data.aade_username,
                    aade_password: data.aade_password,
                    aade_certificate: data.aade_certificate,
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

    const handleCertificateChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setData('aade_certificate', e.target.result);
                setCertificateFile(file.name);
            };
            reader.readAsText(file);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="AADE Settings" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">                    <SettingsNav currentRoute="settings.aade" />
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        AADE MyDATA Settings
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Configure your Greek Tax Authority (AADE) API credentials for tax ID validation
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                            {/* Username */}
                            <div>
                                <InputLabel htmlFor="aade_username" value="AADE Username" />
                                <TextInput
                                    id="aade_username"
                                    type="text"
                                    value={data.aade_username}
                                    onChange={(e) => setData('aade_username', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Your AADE username"
                                    required
                                />
                                {errors.aade_username && (
                                    <p className="mt-2 text-sm text-red-600">{errors.aade_username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <InputLabel htmlFor="aade_password" value="AADE Password" />
                                <TextInput
                                    id="aade_password"
                                    type="password"
                                    value={data.aade_password}
                                    onChange={(e) => setData('aade_password', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Your AADE password"
                                    required
                                />
                                {errors.aade_password && (
                                    <p className="mt-2 text-sm text-red-600">{errors.aade_password}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave empty to keep current password
                                </p>
                            </div>

                            {/* Certificate */}
                            <div>
                                <InputLabel htmlFor="aade_certificate" value="AADE Certificate (PEM)" />
                                <div className="mt-1">
                                    <input
                                        id="aade_certificate"
                                        type="file"
                                        accept=".pem,.crt,.cer"
                                        onChange={handleCertificateChange}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100
                                            dark:file:bg-gray-700 dark:file:text-gray-300"
                                    />
                                </div>
                                {certificateFile && (
                                    <p className="mt-1 text-xs text-green-600">
                                        ✓ File selected: {certificateFile}
                                    </p>
                                )}
                                {errors.aade_certificate && (
                                    <p className="mt-2 text-sm text-red-600">{errors.aade_certificate}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave empty to keep current certificate
                                </p>
                            </div>

                            {/* Test Section */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Test Connection & Validation
                                </h3>

                                {/* Connection Test */}
                                <div className="mb-6">
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={loading}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Testing...' : 'Test AADE Connection'}
                                    </button>
                                    {testResult && (
                                        <Alert
                                            type={testResult.success ? 'success' : 'error'}
                                            message={testResult.message}
                                            className="mt-4"
                                        />
                                    )}
                                </div>

                                {/* Tax ID Validation */}
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="test_tax_id" value="Test Tax ID (ΑΦΜ)" />
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
                                            Enter a Greek tax ID (ΑΦΜ) to validate
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
                                            <p className={`text-sm ${
                                                validateResult.success 
                                                    ? 'text-green-700' 
                                                    : 'text-red-700'
                                            }`}>
                                                {validateResult.message}
                                            </p>
                                            {validateResult.success && validateResult.data && (
                                                <div className="mt-4 space-y-2">
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-gray-700">Name: </span>
                                                        <span className="text-gray-600">{validateResult.data.name}</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-gray-700">Status: </span>
                                                        <span className="text-gray-600">{validateResult.data.status}</span>
                                                    </div>
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
                            {processing ? 'Saving...' : 'Save AADE Settings'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
