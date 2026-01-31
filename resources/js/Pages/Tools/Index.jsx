import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BankAccountsTab from './Tabs/BankAccountsTab';
import VatCheckTab from './Tabs/VatCheckTab';
import ExportAndSendTab from './Tabs/ExportAndSendTab';
import MyAADETab from './Tabs/MyAADETab';

export default function Tools({ bankAccounts, accountantEmails, mydataCredentials }) {
    const [activeTab, setActiveTab] = useState('bank-accounts');

    const tabs = [
        { id: 'bank-accounts', label: 'My Bank Accounts', component: BankAccountsTab },
        { id: 'vat-check', label: 'Check Greek VAT', component: VatCheckTab },
        { id: 'myaade', label: 'myAADE', component: MyAADETab },
        { id: 'export-send', label: 'Export & Send', component: ExportAndSendTab },
    ];

    const activeTabComponent = tabs.find((t) => t.id === activeTab)?.component;

    const getComponentProps = () => {
        if (activeTab === 'bank-accounts') {
            return { bankAccounts };
        }
        if (activeTab === 'export-send') {
            return { accountantEmails };
        }
        if (activeTab === 'myaade') {
            return { mydataCredentials };
        }
        return {};
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tools" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="px-4 py-6 sm:px-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                                Tools
                            </h2>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
                                <div className="flex space-x-8">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                                activeTab === tab.id
                                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            {activeTabComponent && (
                                React.createElement(activeTabComponent, getComponentProps())
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
