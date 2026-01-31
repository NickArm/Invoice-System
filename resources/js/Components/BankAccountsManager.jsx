import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function BankAccountsManager({ bankAccounts = [], companyId }) {
    const [accounts, setAccounts] = useState(bankAccounts);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        bank_name: '',
        iban: '',
        swift_bic: '',
    });
    const [errors, setErrors] = useState({});

    // Frontend IBAN validation
    const isValidIban = (iban) => {
        const cleaned = iban.toUpperCase().replace(/\s/g, '');

        // Check length (15-34 characters)
        if (cleaned.length < 15 || cleaned.length > 34) {
            return false;
        }

        // Check format: 2 letters, 2 digits, then alphanumeric
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
            return false;
        }

        return true;
    };

    // Frontend SWIFT/BIC validation
    const isValidSwiftBic = (bic) => {
        const cleaned = bic.toUpperCase().replace(/\s/g, '');

        // Should be 8 or 11 characters
        if (cleaned.length !== 8 && cleaned.length !== 11) {
            return false;
        }

        // Format: 4 letters (bank), 2 letters (country), 2 alphanumeric, optional 3 alphanumeric
        return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
    };

    const resetForm = () => {
        setFormData({
            bank_name: '',
            iban: '',
            swift_bic: '',
        });
        setErrors({});
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (account) => {
        setEditingId(account.id);
        setFormData({
            bank_name: account.bank_name,
            iban: account.iban,
            swift_bic: account.swift_bic || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Frontend validation
        const newErrors = {};
        if (!formData.bank_name.trim()) {
            newErrors.bank_name = 'Bank name is required';
        }
        if (!formData.iban.trim()) {
            newErrors.iban = 'IBAN is required';
        } else if (!isValidIban(formData.iban)) {
            newErrors.iban = 'The IBAN format is invalid. Please provide a valid IBAN.';
        }
        if (formData.swift_bic.trim() && !isValidSwiftBic(formData.swift_bic)) {
            newErrors.swift_bic = 'The SWIFT/BIC format is invalid. Expected 8 or 11 characters.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            if (editingId) {
                // Update existing
                const response = await axios.patch(
                    `/settings/bank-accounts/${editingId}`,
                    formData
                );
                setAccounts(
                    accounts.map((acc) =>
                        acc.id === editingId ? response.data : acc
                    )
                );
            } else {
                // Create new
                const response = await axios.post(
                    '/settings/business-details/bank-accounts',
                    formData
                );
                setAccounts([...accounts, response.data]);
            }
            resetForm();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ form: err.response.data.message });
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this bank account?')) {
            return;
        }

        try {
            await axios.delete(`/settings/bank-accounts/${id}`);
            setAccounts(accounts.filter((acc) => acc.id !== id));
        } catch (err) {
            alert('Error deleting bank account');
        }
    };

    return (
        <div className="mt-8 border-t pt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Bank Accounts</h3>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add Bank Account
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.bank_name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        bank_name: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Eurobank"
                            />
                            {errors.bank_name && (
                                <p className="text-red-600 text-sm mt-1">
                                    {errors.bank_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                IBAN <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.iban}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        iban: e.target.value.toUpperCase(),
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="GR91 1234567890"
                            />
                            {errors.iban && (
                                <p className="text-red-600 text-sm mt-1">
                                    {errors.iban}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                SWIFT/BIC <span className="text-gray-500">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.swift_bic}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        swift_bic: e.target.value.toUpperCase(),
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="ERBKATHX"
                            />
                            {errors.swift_bic && (
                                <p className="text-red-600 text-sm mt-1">
                                    {errors.swift_bic}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            {editingId ? 'Update' : 'Add'} Bank Account
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* List */}
            {accounts.length > 0 ? (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="bg-white border rounded-lg p-4 flex items-start justify-between hover:shadow-md transition"
                        >
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    {account.bank_name}
                                </p>
                                <p className="text-gray-600 font-mono text-sm">
                                    {account.iban}
                                </p>
                                {account.swift_bic && (
                                    <p className="text-gray-500 text-xs font-mono">
                                        SWIFT: {account.swift_bic}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(account)}
                                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(account.id)}
                                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !showForm ? (
                <p className="text-gray-500 text-center py-8">
                    No bank accounts added yet.
                </p>
            ) : null}
        </div>
    );
}
