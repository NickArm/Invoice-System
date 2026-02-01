import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ introHtml, latestVersion, sections }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-200">
                            Changelog
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Latest version: {latestVersion}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-primary-200/60 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/40 dark:text-primary-300">
                            v{latestVersion}
                        </span>
                        <span className="rounded-full border border-slate-200/60 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                            {sections?.length ?? 0} releases
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Changelog" />

            <div className="mx-auto max-w-5xl space-y-6">
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/20">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300">Release Overview</p>
                            <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">What’s new in Invaice</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Highlights and history from the official changelog.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Latest</p>
                                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">v{latestVersion}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Releases</p>
                                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{sections?.length ?? 0}</p>
                            </div>
                        </div>
                    </div>

                    {introHtml && (
                        <div
                            className="prose prose-slate mt-5 max-w-none text-sm dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: introHtml }}
                        />
                    )}
                </div>

                <div className="space-y-4">
                    {sections?.map((section) => (
                        <div
                            key={`${section.version}-${section.date}`}
                            className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-md shadow-slate-200/30 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/20"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-slate-50/70 px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                        v{section.version}
                                    </span>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{section.date}</span>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Release Notes</span>
                            </div>
                            <div className="p-6">
                                <div
                                    className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-h3:mt-4 prose-ul:my-3 prose-li:my-1 prose-hr:my-6 prose-a:text-primary-600 hover:prose-a:text-primary-700 dark:prose-a:text-primary-400 dark:hover:prose-a:text-primary-300 prose-code:rounded prose-code:bg-slate-100/80 prose-code:px-1.5 prose-code:py-0.5 dark:prose-code:bg-slate-800/80"
                                    dangerouslySetInnerHTML={{ __html: section.html }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
