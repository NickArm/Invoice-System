# Mobile Components Quick Reference

## Import Guide

### SimpleBottomSheet
```jsx
import SimpleBottomSheet from '@/Components/SimpleBottomSheet';

// Usage
<SimpleBottomSheet
    isOpen={isOpen}
    onClose={handleClose}
    title="Modal Title"
    fullHeight={false}
>
    {/* Content */}
</SimpleBottomSheet>
```

### MobileDateInput
```jsx
import MobileDateInput from '@/Components/MobileDateInput';

// Usage
<MobileDateInput
    label="Select Date"
    value={date}
    onChange={setDate}
    min="2024-01-01"
    max="2024-12-31"
    disabled={false}
/>
```

### Keyboard Utilities
```jsx
import {
    handleInputEnter,
    useKeyboardAware,
    disableDoubleTapZoom,
    preventKeyboardShift
} from '@/Utils/keyboardUtils';

// Auto-blur on Enter
<input onKeyDown={(e) => handleInputEnter(e, onSubmit)} />

// Scroll into view on focus
const { handleInputFocus, handleInputBlur } = useKeyboardAware(inputRef);

// Prevent double-tap zoom
<input ref={inputRef} onLoad={() => disableDoubleTapZoom(inputRef)} />

// iOS keyboard prevention
useEffect(() => {
    preventKeyboardShift();
}, []);
```

### Mobile Form Utils
```jsx
import {
    useMobileFormSubmit,
    handleMobileSubmit,
    getMobileFormErrorClass,
    getMobileErrorMessage,
    handleMobileBlur,
    useDebouncedMobileInput,
    handleMobileValidation,
    getMobileLabelClass
} from '@/Utils/mobileFormUtils';

// Form submission
const { handleSubmit } = useMobileFormSubmit(onSubmit);
<form onSubmit={handleSubmit}>...</form>

// Error message (show first only)
const error = getMobileErrorMessage(errors, 'fieldName');
<span className="text-red-500">{error}</span>

// Input with debounce
const { handleChange } = useDebouncedMobileInput(onSearch, 300);
<input onChange={handleChange} />

// Validation on blur
const { isValid, error } = handleMobileValidation(e, validator);

// Form label with required indicator
<label className={getMobileLabelClass(true)}>Email</label>
```

## Common Patterns

### Modal with Loading and Error States
```jsx
const [isOpen, setIsOpen] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    
    try {
        const data = await fetchData();
        setData(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};

return (
    <>
        <button onClick={handleOpen}>Open</button>
        <SimpleBottomSheet
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Details"
        >
            {isLoading && <div className="animate-spin">Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!isLoading && !error && <YourContent />}
        </SimpleBottomSheet>
    </>
);
```

### Form with Mobile Input
```jsx
const [formData, setFormData] = useState({
    date: '',
    description: ''
});

const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit form
};

return (
    <form onSubmit={handleSubmit}>
        <MobileDateInput
            label="Date"
            value={formData.date}
            onChange={(value) => setFormData({...formData, date: value})}
            max={new Date().toISOString().split('T')[0]}
        />
        <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            onKeyDown={(e) => handleInputEnter(e)}
            placeholder="Enter description"
        />
        <button type="submit">Submit</button>
    </form>
);
```

### Pull-to-Refresh Integration
```jsx
import { usePullToRefresh } from '@/Hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/Components/PullToRefreshIndicator';

export default function DataList() {
    const [data, setData] = useState([]);
    
    const { containerRef, pullDistance, isPulling } = usePullToRefresh(async () => {
        const freshData = await fetchData();
        setData(freshData);
    });
    
    return (
        <div ref={containerRef} className="overflow-y-auto max-h-screen">
            <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isPulling}
            />
            {/* Your list content */}
        </div>
    );
}
```

## Responsive Class Examples

### Mobile-First Classes
```jsx
// Mobile defaults, desktop overrides
className="w-full sm:w-96 p-4 sm:p-6"
className="flex-col sm:flex-row"
className="text-base sm:text-sm"
className="rounded-t-2xl sm:rounded-lg"
className="h-[95vh] sm:h-auto sm:max-h-[90vh]"
```

### Dark Mode Classes
```jsx
className="bg-white dark:bg-slate-800"
className="text-slate-900 dark:text-white"
className="border-slate-200 dark:border-slate-600"
className="hover:bg-slate-50 dark:hover:bg-slate-700"
```

## Touch Event Handling

### Simple Touch Handler
```jsx
const handleTouchStart = (e) => {
    const touch = e.touches[0];
    // Do something with touch.clientY, touch.clientX
};

return (
    <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        {/* Content */}
    </div>
);
```

### Gesture Detection
```jsx
const handleSwipe = (startX, startY, endX, endY) => {
    const diffX = startX - endX;
    const diffY = startY - endY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        diffX > 0 ? console.log('Left') : console.log('Right');
    } else {
        // Vertical swipe
        diffY > 0 ? console.log('Up') : console.log('Down');
    }
};
```

## Accessibility Tips

### Focus Management
```jsx
// Auto-focus on modal open
useEffect(() => {
    if (isOpen) {
        const closeButton = document.querySelector('[aria-label="Close"]');
        closeButton?.focus();
    }
}, [isOpen]);
```

### ARIA Labels
```jsx
<button aria-label="Close modal">
    <svg>...</svg>
</button>

<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">Modal Title</h2>
</div>
```

### Semantic HTML
```jsx
<form onSubmit={handleSubmit}>
    <label htmlFor="email">Email</label>
    <input id="email" type="email" required />
    <button type="submit">Submit</button>
</form>
```

## Performance Tips

### Lazy Load Components
```jsx
const SimpleBottomSheet = lazy(() => 
    import('@/Components/SimpleBottomSheet')
);

<Suspense fallback={<div>Loading...</div>}>
    <SimpleBottomSheet {...props} />
</Suspense>
```

### Memoize Heavy Components
```jsx
const TransactionDetails = React.memo(({ data }) => (
    <div>{/* Expensive render */}</div>
));
```

### Debounce Input Changes
```jsx
const { handleChange } = useDebouncedMobileInput((value) => {
    searchAPI(value);
}, 500);
```

## Testing Examples

### Jest Test for Modal
```jsx
import { render, screen } from '@testing-library/react';
import SimpleBottomSheet from '@/Components/SimpleBottomSheet';

test('closes modal on escape key', () => {
    const onClose = jest.fn();
    render(
        <SimpleBottomSheet
            isOpen={true}
            onClose={onClose}
            title="Test"
        >
            Content
        </SimpleBottomSheet>
    );
    
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
});
```

### Cypress Test for Mobile
```javascript
describe('Mobile Modal', () => {
    it('shows bottom sheet on mobile', () => {
        cy.viewport('iphone-x');
        cy.visit('/');
        cy.get('[data-testid="open-modal"]').click();
        cy.get('[role="dialog"]')
            .should('have.css', 'justifyContent', 'flex-end');
    });
});
```

## Debugging Tips

### Check Mobile Viewport
```javascript
// In DevTools console
console.log(window.innerWidth);  // Get viewport width
console.log(window.innerHeight); // Get viewport height
console.log(window.devicePixelRatio); // Get device pixel ratio
```

### Monitor Touch Events
```javascript
document.addEventListener('touchstart', (e) => {
    console.log('Touch start:', e.touches[0].clientX, e.touches[0].clientY);
});
```

### Check Service Worker
```javascript
// In DevTools console
navigator.serviceWorker.getRegistrations()
    .then(registrations => {
        console.log('Service Workers:', registrations);
    });
```

## Common Issues & Solutions

### Bottom Sheet not appearing
- Check z-index (should be 50 or higher)
- Verify parent doesn't have `overflow: hidden`
- Ensure isOpen state is true

### Keyboard not dismissing
- Check input has onKeyDown handler
- Verify `handleInputEnter` is called
- Ensure `e.target.blur()` actually blurs

### Date picker shows wrong format
- Check HTML lang attribute
- Browser uses system locale
- Set explicit locale in date handling

### Dark mode not working
- Verify `dark:` classes in component
- Check if dark class on html element
- Clear browser cache

### Pull-to-refresh not triggering
- Scroll must be at top (scrollTop === 0)
- Pull distance must exceed 80px
- Check touch event listeners attached
