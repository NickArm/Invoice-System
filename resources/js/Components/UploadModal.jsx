import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { router } from '@inertiajs/react';

export default function UploadModal({ isOpen, onClose }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const getXsrfCookie = () => {
            const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            return match ? decodeURIComponent(match[1]) : null;
        };

        const headers = {
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            ...(getXsrfCookie() ? { 'X-XSRF-TOKEN': getXsrfCookie() } : {}),
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
        };

        const attachmentIds = [];

        for (const file of files) {
            const formData = new FormData();
            if (csrfToken) {
                formData.append('_token', csrfToken);
            }
            formData.append('file', file);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    headers,
                    credentials: 'same-origin',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed with status ${response.status}`);
                }

                const data = await response.json();
                if (!data?.success || !data?.attachment_id) {
                    throw new Error('Upload response missing attachment id');
                }

                attachmentIds.push(data.attachment_id);

                // Add small delay between uploads to avoid rate limiting
                if (files.indexOf(file) < files.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } catch (error) {
                alert(`Upload failed for ${file.name}: ${error.message}`);
            }
        }

        setUploading(false);
        onClose();
        setFiles([]);

        if (attachmentIds.length === 0) {
            return;
        }

        const [firstId, ...restIds] = attachmentIds;
        const queueParam = restIds.length ? `?queue=${restIds.join(',')}` : '';
        router.visit(`/invoices/extract/${firstId}${queueParam}`);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Upload Invoice
                                </Dialog.Title>

                                <div className="mt-4">
                                    <div
                                        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 ${
                                            dragActive
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-300 bg-gray-50'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            multiple
                                            onChange={handleFileChange}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />

                                        {files.length > 0 ? (
                                            <div className="text-center max-h-32 overflow-y-auto w-full">
                                                {files.map((f, idx) => (
                                                    <div key={idx} className="text-sm font-medium text-gray-900 py-1">
                                                        {f.name} ({(f.size / 1024).toFixed(2)} KB)
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg
                                                    className="mx-auto h-12 w-12 text-gray-400"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    viewBox="0 0 48 48"
                                                >
                                                    <path
                                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                        strokeWidth={2}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                                <p className="mt-2 text-sm text-gray-600">
                                                    Drag & drop or click to select
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PDF, JPG, PNG (max 10MB each) - Multiple files supported
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        onClick={onClose}
                                        disabled={uploading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                                        onClick={handleUpload}
                                        disabled={files.length === 0 || uploading}
                                    >
                                        {uploading ? 'Uploading...' : `Upload & Extract${files.length > 1 ? ` (${files.length})` : ''}`}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
