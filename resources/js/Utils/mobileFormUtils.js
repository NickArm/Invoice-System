/**
 * Form submission utilities for better mobile UX
 */

/**
 * Hook for handling mobile-friendly form submission
 * Auto-blur all inputs after successful submission
 */
export function useMobileFormSubmit(onSubmit) {
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Call the submission handler
            const result = await onSubmit(e);
            
            // Blur all inputs to dismiss keyboard
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => input.blur());
            
            return result;
        } catch (error) {
            // Don't blur on error - user might want to fix it
            console.error('Form submission error:', error);
            throw error;
        }
    };
    
    return { handleSubmit };
}

/**
 * Prevent default behavior and blur on submit
 */
export function handleMobileSubmit(e, onSubmit = null) {
    e.preventDefault();
    
    // Blur active element to dismiss keyboard
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    if (onSubmit && typeof onSubmit === 'function') {
        return onSubmit(e);
    }
}

/**
 * Create touch-friendly form error display
 * Shows errors with better mobile visibility
 */
export function getMobileFormErrorClass(hasError) {
    return hasError 
        ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500';
}

/**
 * Format form errors for mobile display
 * Show one error at a time for better mobile UX
 */
export function getMobileErrorMessage(errors, fieldName) {
    if (Array.isArray(errors?.[fieldName])) {
        return errors[fieldName][0]; // Show only first error on mobile
    }
    return errors?.[fieldName] || null;
}

/**
 * Auto-submit form on phone when user touches outside
 * Useful for form fields that auto-update
 */
export function handleMobileBlur(e, onSubmit = null) {
    e.target.blur();
    
    if (onSubmit && typeof onSubmit === 'function') {
        // Add small delay to ensure UI is updated before blur
        setTimeout(() => {
            onSubmit(e);
        }, 100);
    }
}

/**
 * Touch-friendly input handler with debounce
 * Prevents too many API calls during typing
 */
export function useDebouncedMobileInput(callback, delay = 500) {
    let timeoutId;
    
    const handleChange = (e) => {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
            if (callback && typeof callback === 'function') {
                callback(e.target.value);
            }
        }, delay);
    };
    
    return { handleChange };
}

/**
 * Validate input on blur (mobile-friendly)
 * Shows error immediately after user leaves field
 */
export function handleMobileValidation(e, validator) {
    const { value } = e.target;
    const error = validator(value);
    
    return {
        isValid: !error,
        error: error,
        shouldShowError: e.type === 'blur' // Only show on blur on mobile
    };
}

/**
 * Create accessible form label with required indicator
 * Mobile-friendly with larger text
 */
export function getMobileLabelClass(required = false) {
    return `block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`;
}
