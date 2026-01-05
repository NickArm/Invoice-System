import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-gray-800">
            <nav className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                                <ApplicationLogo className="h-6 w-6 fill-current" />
                            </div>
                        </Link>

                        <div className="hidden items-center gap-6 text-sm font-semibold sm:flex">
                            <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                Dashboard
                            </NavLink>
                            <NavLink href={route('invoices.index')} active={route().current('invoices.*')}>
                                Invoices
                            </NavLink>
                            <NavLink href={route('business-entities.index')} active={route().current('business-entities.*')}>
                                Business Entities
                            </NavLink>
                        </div>
                    </div>

                    <div className="hidden items-center gap-3 sm:flex">
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                            {user.name?.charAt(0) ?? '?'}
                                        </span>
                                        <span>{user.name}</span>
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right">
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('settings.business-details')}>
                                        Business Details
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('settings.accountant-emails')}>
                                        Settings
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('settings.categories.index')}>
                                        Invoice Categories
                                    </Dropdown.Link>
                                    {user.role === 'admin' && (
                                        <Dropdown.Link href={route('admin.users.index')}>
                                            User Management
                                        </Dropdown.Link>
                                    )}
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition hover:bg-slate-100 focus:outline-none"
                        >
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path
                                    className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                                <path
                                    className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden border-t border-slate-200 bg-white'}>
                    <div className="space-y-1 px-4 pb-3 pt-3">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('invoices.index')} active={route().current('invoices.*')}>
                            Invoices
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('business-entities.index')}
                            active={route().current('business-entities.*')}
                        >
                            Business Entities
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-slate-200 pb-3 pt-3">
                        <div className="px-4">
                            <div className="text-base font-semibold text-gray-800">{user.name}</div>
                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                        </div>

                        <div className="mt-3 space-y-1 px-4">
                            <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('settings.business-details')}>
                                Business Details
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('settings.accountant-emails')}>
                                Settings
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('settings.categories.index')}>
                                Invoice Categories
                            </ResponsiveNavLink>
                            {user.role === 'admin' && (
                                <ResponsiveNavLink href={route('admin.users.index')}>
                                    User Management
                                </ResponsiveNavLink>
                            )}
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
                        {header}
                    </div>
                </header>
            )}

            <main className="mx-auto max-w-6xl pb-10 pt-6">{children}</main>
        </div>
    );
}
