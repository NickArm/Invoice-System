import React, { useRef } from 'react';

/**
 * Mobile-friendly date input component
 * Uses native date picker on mobile, better formatted display
 */
export default function MobileDateInput({
    label,
    value,
    onChange,
    max,
    min,
    disabled = false,
    className = '',
}) {
    const inputRef = useRef(null);

    const handleChange = (e) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={inputRef}
                type="date"
                value={value}
                onChange={handleChange}
                disabled={disabled}
                min={min}
                max={max}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white text-base sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
            />
        </div>
    );
}
