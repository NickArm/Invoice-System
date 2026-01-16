import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function AccountantEmails({ emails = '', message = '' }) {
    const { flash = {} } = usePage().props || {};

    const { data, setData, post, processing, errors } = useForm({
        emails: emails,
        message: message,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.accountant-emails.update'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Accountant Emails" />

            <div className="py-10">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm sm:rounded-2xl border border-slate-200/60 dark:bg-slate-900 dark:border-slate-700">
                        <div className="px-6 py-6 sm:px-8">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Settings</p>
                                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Accountant Emails</h2>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Define email recipients and an optional message that will appear in the exported emails.
                                    </p>
                                </div>
                                {flash?.success && (
                                    <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-900/60">
                                        {flash.success}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Emails */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Email Recipients
                                    </label>
                                    <textarea
                                        value={data.emails}
                                        onChange={(e) => setData('emails', e.target.value)}
                                        placeholder="Separate emails with semicolon (;)&#10;Example: info@example.com;nikos@example.com;maria@example.com"
                                        className={`w-full rounded-xl border px-3 py-2 text-sm font-mono focus:border-primary-300 focus:ring-primary-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:focus:border-primary-400 dark:focus:ring-primary-400 ${
                                            errors.emails ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                        rows={3}
                                    />
                                    {errors.emails && (
                                        <p className="text-sm text-red-600">{errors.emails}</p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Separate each email with a semicolon (;)</p>
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Optional Message
                                    </label>
                                    <textarea
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Write an optional message that will appear in the email before the statistics (HTML tags are not allowed)"
                                        className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-primary-300 focus:ring-primary-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:focus:border-primary-400 dark:focus:ring-primary-400 ${
                                            errors.message ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                        rows={5}
                                    />
                                    {errors.message && (
                                        <p className="text-sm text-red-600">{errors.message}</p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Plain text only - HTML tags will be stripped for security</p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:bg-slate-400"
                                    >
                                        {processing ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
