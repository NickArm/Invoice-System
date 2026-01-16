import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserDataForm({ className = '' }) {
    const [confirmingDataDeletion, setConfirmingDataDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmDataDeletion = () => {
        setConfirmingDataDeletion(true);
    };

    const deleteData = (e) => {
        e.preventDefault();

        destroy(route('profile.purge-data'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingDataDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                    Delete All Data
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    Permanently delete all your invoices, business entities, and uploaded files.
                    Your account will remain active, but all associated data will be removed.
                    This action cannot be undone.
                </p>
            </header>

            <DangerButton onClick={confirmDataDeletion}>
                Delete All Data
            </DangerButton>

            <Modal show={confirmingDataDeletion} onClose={closeModal}>
                <form onSubmit={deleteData} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                        Are you sure you want to delete all your data?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                        This will permanently delete all your invoices, business entities,
                        and uploaded files. Your account will remain active but completely empty.
                        Please enter your password to confirm.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            Delete All Data
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
