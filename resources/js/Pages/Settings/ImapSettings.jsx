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
        post(route('settings.imap.update'), {
            onSuccess: () => {
                setData('imap_password', ''); // Clear password after save
            },
        });
    };

    const testConnection = async () => {
        if (!data.imap_host || !data.imap_username || !data.imap_password) {
            setTestResult({
                success: false,
                message: 'Please fill in host, username, and password to test connection.',
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
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
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
                                    <p className="mt-1 text-xs text-gray-500">
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
                                    <TextInput
                                        id="imap_password"
                                        type="password"
                                        className="mt-1 block w-full"
                                        value={data.imap_password}
                                        onChange={(e) => setData('imap_password', e.target.value)}
                                        placeholder={settings.imap_password ? '••••••••' : 'Enter password'}
                                    />
                                    <InputError message={errors.imap_password} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Leave blank to keep existing password. For Gmail, use an App Password.
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
                                        <p className="mt-1 text-xs text-gray-500">
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
