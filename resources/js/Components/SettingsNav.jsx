import { Link } from '@inertiajs/react';

export default function SettingsNav({ currentRoute }) {
    const navItems = [
        { label: 'Business Details', route: 'settings.business-details' },
        { label: 'Accountant Emails', route: 'settings.accountant-emails' },
        { label: 'Email (IMAP)', route: 'settings.imap' },
        { label: 'AADE Integration', route: 'settings.aade' },
        { label: 'Categories', route: 'settings.categories.index' },
    ];

    return (
        <nav className="bg-white shadow-sm rounded-lg mb-6">
            <div className="px-4 py-0 sm:px-6">
                <div className="flex flex-wrap gap-2 py-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.route}
                            href={route(item.route)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                currentRoute === item.route
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
