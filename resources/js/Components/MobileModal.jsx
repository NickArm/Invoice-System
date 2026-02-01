import React from 'react';

/**
 * Mobile-optimized simple modal component
 * Cleaner design with proper touch handling
 */
export default function MobileModal({ isOpen, title, children, onClose, actions = null }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal - Bottom sheet on mobile, center on desktop */}
            <div
                className="relative bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] sm:max-h-none overflow-y-auto shadow-xl transform transition-all"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4 sm:px-6 sm:py-6">
                    {children}
                </div>

                {/* Actions Footer */}
                {actions && (
                    <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 dark:border-slate-600 flex gap-2 justify-end">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
