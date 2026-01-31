import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head } from '@inertiajs/react';

export default function ImapSettings({ auth, settings }) {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        imap_host: settings.imap_host || '',
        imap_port: settings.imap_port || 993,
        imap_username: settings.imap_username || '',
        imap_password: '',
        imap_ssl: settings.imap_ssl ?? true,
        imap_subject_filter: settings.imap_subject_filter || '',
        imap_subject_match_type: settings.imap_subject_match_type || 'contains',
        imap_enabled: settings.imap_enabled || false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.imap.update'));
    };

    const testConnection = async () => {
        // If password field is empty but there's an existing password, show error asking to re-enter
        if (!data.imap_password && !settings.imap_password_exists) {
            setTestResult({
                success: false,
                message: 'Please enter password to test connection.',
            });
            return;
        }

        if (!data.imap_host || !data.imap_username) {
            setTestResult({
                success: false,
                message: 'Please fill in host and username to test connection.',
            });
            return;
        }

        // If password is empty, user must enter it for testing
        if (!data.imap_password && settings.imap_password_exists) {
            setTestResult({
                success: false,
                message: 'Please re-enter your password to test the connection.',
            });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const { data: result } = await axios.post(route('settings.imap.test'), {
                imap_host: data.imap_host,
                imap_port: data.imap_port,
                imap_username: data.imap_username,
                imap_password: data.imap_password,
                imap_ssl: data.imap_ssl,
            });

            setTestResult(result);
        } catch (error) {
            const message = error.response?.data?.message ?? error.message;
            setTestResult({
                success: false,
                message: 'Failed to test connection: ' + message,
            });
        } finally {
            setTesting(false);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Email Settings (IMAP)</h2>}
        >
            <Head title="Email Settings" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg dark:bg-slate-900">
                        <div className="p-6 text-gray-900">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Automatic Invoice Import from Email</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Configure IMAP settings to automatically fetch and process invoice attachments from your email inbox.
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Enable/Disable Toggle */}
                                <div className="flex items-center">
                                    <input
                                        id="imap_enabled"
                                        type="checkbox"
                                        checked={data.imap_enabled}
                                        onChange={(e) => setData('imap_enabled', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
                                    />
                                    <label htmlFor="imap_enabled" className="ml-2 block text-sm text-gray-900">
                                        Enable automatic email fetching
                                    </label>
                                </div>

                                {/* IMAP Host */}
                                <div>
                                    <InputLabel htmlFor="imap_host" value="IMAP Server Host" />
                                    <TextInput
                                        id="imap_host"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.imap_host}
                                        onChange={(e) => setData('imap_host', e.target.value)}
                                        placeholder="e.g., imap.gmail.com or imap.zoho.com"
                                    />
                                    <InputError message={errors.imap_host} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                        Example: imap.gmail.com, imap.zoho.com, outlook.office365.com
                                    </p>
                                </div>

                                {/* IMAP Port & SSL */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="imap_port" value="Port" />
                                        <TextInput
                                            id="imap_port"
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={data.imap_port}
                                            onChange={(e) => setData('imap_port', parseInt(e.target.value))}
                                        />
                                        <InputError message={errors.imap_port} className="mt-2" />
                                    </div>

                                    <div className="flex items-center pt-8">
                                        <input
                                            id="imap_ssl"
                                            type="checkbox"
                                            checked={data.imap_ssl}
                                            onChange={(e) => setData('imap_ssl', e.target.checked)}
                                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
                                        />
                                        <label htmlFor="imap_ssl" className="ml-2 block text-sm text-gray-900">
                                            Use SSL/TLS
                                        </label>
                                    </div>
                                </div>

                                {/* IMAP Username */}
                                <div>
                                    <InputLabel htmlFor="imap_username" value="Email Address / Username" />
                                    <TextInput
                                        id="imap_username"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.imap_username}
                                        onChange={(e) => setData('imap_username', e.target.value)}
                                        placeholder="invoices@armenisnick.gr"
                                    />
                                    <InputError message={errors.imap_username} className="mt-2" />
                                </div>

                                {/* IMAP Password */}
                                <div>
                                    <InputLabel htmlFor="imap_password" value="Password" />
                                    <div className="relative mt-1">
                                        <TextInput
                                            id="imap_password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="block w-full pr-10"
                                            value={data.imap_password}
                                            onChange={(e) => setData('imap_password', e.target.value)}
                                            placeholder={settings.imap_password_exists ? '••••••••••••' : 'Enter password'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            {showPassword ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.imap_password} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                        {settings.imap_password_exists
                                            ? 'Leave blank to keep existing password. For Gmail, use an App Password.'
                                            : 'For Gmail, use an App Password.'
                                        }
                                    </p>
                                </div>

                                {/* Subject Filter */}
                                <div className="border-t pt-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Email Filter</h4>

                                    <div>
                                        <InputLabel htmlFor="imap_subject_filter" value="Subject Filter (optional)" />
                                        <TextInput
                                            id="imap_subject_filter"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.imap_subject_filter}
                                            onChange={(e) => setData('imap_subject_filter', e.target.value)}
                                            placeholder="e.g., Invoice"
                                        />
                                        <InputError message={errors.imap_subject_filter} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                            Only process emails with this text in the subject line. Leave empty to process all emails.
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <InputLabel value="Match Type" />
                                        <div className="mt-2 space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="contains"
                                                    checked={data.imap_subject_match_type === 'contains'}
                                                    onChange={(e) => setData('imap_subject_match_type', e.target.value)}
                                                    className="text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">
                                                    Contains - Subject contains the filter text (e.g., "Invoice #123" matches "Invoice")
                                                </span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="exact"
                                                    checked={data.imap_subject_match_type === 'exact'}
                                                    onChange={(e) => setData('imap_subject_match_type', e.target.value)}
                                                    className="text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">
                                                    Exact Match - Subject must exactly match the filter text
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Connection Result */}
                                {testResult && (
                                    <div
                                        className={`rounded-md p-4 ${
                                            testResult.success
                                                ? 'bg-green-50 text-green-800 border border-green-200'
                                                : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}
                                    >
                                        <p className="text-sm font-medium">
                                            {testResult.success ? '✓ ' : '✗ '}
                                            {testResult.message}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Settings'}
                                    </PrimaryButton>

                                    <SecondaryButton
                                        type="button"
                                        onClick={testConnection}
                                        disabled={testing || processing}
                                    >
                                        {testing ? 'Testing...' : 'Test Connection'}
                                    </SecondaryButton>
                                </div>
                            </form>

                            {/* Info Box */}
                            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h5 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h5>
                                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                                    <li>The system will check your inbox periodically for new emails</li>
                                    <li>Emails matching your subject filter will be processed</li>
                                    <li>Invoice attachments (images, PDFs) will be extracted automatically</li>
                                    <li>Invoices will be created as <strong>DRAFT</strong> status for your review</li>
                                    <li>You can approve or edit draft invoices before they appear in reports</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
