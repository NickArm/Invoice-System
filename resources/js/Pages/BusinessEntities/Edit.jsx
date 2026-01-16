import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Edit({ entity }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: '',
        tax_id: '',
        tax_office: '',
        email: '',
        country: '',
        city: '',
        address: '',
        postal_code: '',
        phone: '',
        mobile: '',
        type: 'customer',
    });

    // Always sync form state with the loaded entity (important after a failed/403 visit)
    useEffect(() => {
        setData({
            name: entity.name || '',
            tax_id: entity.tax_id || '',
            tax_office: entity.tax_office || '',
            email: entity.email || '',
            country: entity.country || '',
            city: entity.city || '',
            address: entity.address || '',
            postal_code: entity.postal_code || '',
            phone: entity.phone || '',
            mobile: entity.mobile || '',
            type: entity.type || 'customer',
        });
    }, [entity, setData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('business-entities.update', entity.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">Edit Business Entity</h2>}>
            <Head title="Edit Business Entity" />

            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Update partner</p>
                            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{entity.name}</h3>
                        </div>
                        <Link
                            href={route('business-entities.index')}
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
                        >
                            Back
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'customer')}
                                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            data.type === 'customer'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        Customer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'supplier')}
                                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            data.type === 'supplier'
                                                ? 'border-primary-200 bg-primary-50 text-primary-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        Supplier
                                    </button>
                                </div>
                                {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tax ID</label>
                                <input
                                    type="text"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.tax_id && <p className="text-sm text-red-600">{errors.tax_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tax Office</label>
                                <input
                                    type="text"
                                    value={data.tax_office}
                                    onChange={(e) => setData('tax_office', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.tax_office && <p className="text-sm text-red-600">{errors.tax_office}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Country</label>
                                <input
                                    type="text"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">City</label>
                                <input
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</label>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Postal Code</label>
                                <input
                                    type="text"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.postal_code && <p className="text-sm text-red-600">{errors.postal_code}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile</label>
                                <input
                                    type="text"
                                    value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-primary-400"
                                />
                                {errors.mobile && <p className="text-sm text-red-600">{errors.mobile}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Link
                                href={route('business-entities.index')}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                            >
                                Update Entity
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
