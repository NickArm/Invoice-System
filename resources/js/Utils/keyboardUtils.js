/**
 * Keyboard handling utilities for better mobile UX
 */

/**
 * Auto-blur input after enter key on mobile
 */
export function handleInputEnter(e, onSubmit = null) {
    if (e.key === 'Enter') {
        e.target.blur();
        if (onSubmit) onSubmit();
    }
}

/**
 * Prevent keyboard shift layout on focus
 * Useful for iOS especially
 */
export function preventKeyboardShift() {
    if (typeof window !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Prevent the blue highlight on iOS
        document.body.style.WebkitTouchCallout = 'none';
    }
}

/**
 * Custom hook for form field keyboard handling
 */
export function useKeyboardAware(inputRef) {
    const handleInputFocus = () => {
        if (inputRef?.current) {
            // Delay scroll to account for keyboard animation
            setTimeout(() => {
                inputRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 300);
        }
    };

    const handleInputBlur = () => {
        // Dismiss keyboard on blur
        if (typeof window !== 'undefined') {
            document.activeElement?.blur();
        }
    };

    return { handleInputFocus, handleInputBlur };
}

/**
 * Prevent double-tap zoom on input fields
 */
export function disableDoubleTapZoom(ref) {
    if (!ref?.current) return;

    let lastTouchEnd = 0;
    ref.current.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}
