import React, { useEffect, useRef } from 'react';

/**
 * Simple mobile-first bottom sheet modal
 * Automatically closes when clicking outside on desktop
 */
export default function SimpleBottomSheet({
    isOpen = false,
    onClose,
    title,
    children,
    fullHeight = false,
    showBackdrop = true,
}) {
    const sheetRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleEscape);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            {showBackdrop && (
                <div
                    className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={`relative w-full sm:w-full sm:max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-lg shadow-2xl transition-transform z-50 ${
                    fullHeight ? 'h-[95vh] sm:h-auto sm:max-h-[90vh]' : 'max-h-[80vh]'
                } flex flex-col`}
            >
                {/* Header */}
                {title && (
                    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-t-lg">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Close"
                        >
                            <svg
                                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
