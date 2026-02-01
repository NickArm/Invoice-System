# Mobile Optimization Testing Guide

## Pre-Testing Checklist
- [ ] Clear browser cache (or use Incognito/Private mode)
- [ ] Ensure latest build is deployed (`npm run build`)
- [ ] Have both iOS and Android devices available (or emulators)
- [ ] Test both light and dark modes
- [ ] Network throttling enabled (DevTools → Network tab → "Slow 4G")

## Component Testing

### 1. SimpleBottomSheet Modal (TransactionDetailsModal)

#### Desktop Testing
- [ ] Modal appears centered on screen
- [ ] Modal has dark overlay/backdrop
- [ ] Clicking backdrop closes modal
- [ ] Pressing Escape key closes modal
- [ ] Close button (X) in header works
- [ ] Content is scrollable if too long
- [ ] Header stays sticky while scrolling
- [ ] Dark mode colors are correct

#### Mobile Testing (iOS)
- [ ] Modal slides up from bottom
- [ ] Modal has rounded corners at top (rounded-t-2xl)
- [ ] Swiping down gesture closes modal (test manually)
- [ ] No body scroll behind modal
- [ ] Keyboard doesn't push modal off screen
- [ ] Safe area (notch) is respected
- [ ] Touch targets are large (44px minimum)

#### Mobile Testing (Android)
- [ ] Modal animates smoothly from bottom
- [ ] Transparent system navigation bar
- [ ] Back button closes modal
- [ ] Modal doesn't overlap navigation bar
- [ ] System keyboards work correctly
- [ ] Touch ripples on buttons (native behavior)

### 2. Pull-to-Refresh Functionality

#### Mobile Testing
- [ ] Scroll to top of transaction list
- [ ] Pull down with finger - see refresh indicator
- [ ] Icon rotates as you pull (0-360 degrees)
- [ ] Pull > 80px triggers refresh
- [ ] Release after pulling - loading spinner appears
- [ ] New data loads (or shows "no change")
- [ ] Spinner disappears after data loads
- [ ] Works with slow network (3G simulation)
- [ ] Doesn't interfere with normal scrolling
- [ ] Doesn't trigger when not at scroll top

#### Error Handling
- [ ] Smooth recovery if API fails
- [ ] Pull-to-refresh still works after error
- [ ] Error messages display correctly
- [ ] Rate limit errors show actual message

### 3. Date Input Component (MobileDateInput)

#### Mobile Testing
- [ ] Tapping input shows native date picker
- [ ] iOS: Shows date wheel picker
- [ ] Android: Shows calendar picker
- [ ] Selected date updates in input
- [ ] Min/Max constraints work
- [ ] Disabled state shows dimmed input
- [ ] Dark mode styling looks good

#### Desktop Testing
- [ ] Shows HTML5 date input
- [ ] Calendar icon appears
- [ ] Keyboard input works (YYYY-MM-DD format)
- [ ] Arrow keys work
- [ ] Tab navigation works

### 4. Keyboard Handling

#### Input Blur on Submit
- [ ] Type in date field → keyboard appears
- [ ] Press Enter → keyboard dismisses
- [ ] Keyboard blur is smooth (no jarring)
- [ ] Focus moves to next field if applicable

#### iOS Keyboard Shift
- [ ] Keyboard appears without shifting content
- [ ] Input field scrolls into view
- [ ] No black bars or layout shifts
- [ ] Blue highlight removed from inputs

#### Android Keyboard
- [ ] Keyboard overlays content (not pushes up)
- [ ] Input field scrolls into view on focus
- [ ] Keyboard type matches input type (date = number, text = text)

### 5. Dark Mode Across New Components

#### Visual Testing
- [ ] SimpleBottomSheet header background
  - Light: white/gray
  - Dark: dark-gray/slate-800
- [ ] Text contrast is sufficient
  - Light text on dark: #000000 on #ffffff (good)
  - Light text on dark: #ffffff on #1e293b (good)
- [ ] Buttons have visible state changes
- [ ] Icons are visible in both modes
- [ ] Borders have proper contrast

#### Transition Testing
- [ ] Toggle dark mode while modal is open
- [ ] Colors update smoothly
- [ ] No flickering or jarring changes
- [ ] System dark mode preference respected

### 6. Error Messages and Loading States

#### Loading State
- [ ] Spinner appears and rotates
- [ ] Content is disabled while loading
- [ ] No interaction while loading
- [ ] Loading state clears after 5+ seconds (timeout)

#### Error Display
- [ ] Error message displays with icon
- [ ] Text is readable and not cut off
- [ ] Long error messages wrap properly
- [ ] Error styling is visible in dark mode
- [ ] Retry/close options are available

#### No Data States
- [ ] Fallback UI appears when no data available
- [ ] Icon is centered and visible
- [ ] Message text is helpful
- [ ] User knows what to do next

### 7. Responsive Layout Testing

#### Tablet (iPad/Android Tablet)
- [ ] Layout adapts to tablet size
- [ ] Modal uses max-width properly
- [ ] Buttons don't stretch too wide
- [ ] Text remains readable
- [ ] 2-column layouts work on landscape

#### Phone (Portrait)
- [ ] Full-width layout works
- [ ] Bottom sheet uses full width
- [ ] Text doesn't overflow
- [ ] Padding is appropriate

#### Phone (Landscape)
- [ ] Modal doesn't exceed viewport height
- [ ] Scrolling works for long content
- [ ] Keyboard doesn't cover content
- [ ] Buttons remain accessible

### 8. PWA and Service Worker Testing

#### Installation
- [ ] iOS: "Add to Home Screen" option appears
- [ ] Android: "Install app" prompt appears
- [ ] App icon displays correctly
- [ ] App name is "Invaice"
- [ ] Standalone mode (no address bar)

#### Offline Testing
- [ ] Open DevTools → Network → Offline
- [ ] Previously visited pages load from cache
- [ ] Service worker icon visible in DevTools
- [ ] Cache contains expected files
- [ ] Online → Offline transition smooth

#### Cache Strategy
- [ ] CSS/JS files cached
- [ ] Images cached
- [ ] API calls show network status
- [ ] Manifest.json cached

### 9. Performance Testing

#### Load Time
- [ ] Modal opens within 300ms
- [ ] Pull-to-refresh triggers within 100ms
- [ ] Date picker opens native immediately
- [ ] No jank during animations

#### Memory Usage
- [ ] DevTools Memory tab shows stable usage
- [ ] No memory leaks on multiple modal open/close cycles
- [ ] Long lists don't cause slowdown
- [ ] Images don't cause memory bloat

#### Network Usage
- [ ] Slow 4G: Still responsive
- [ ] 3G: Data still loads
- [ ] Airplane mode: Cache works
- [ ] File sizes are reasonable (~5KB gzipped per component)

### 10. Accessibility Testing

#### Screen Reader (VoiceOver/TalkBack)
- [ ] Modal title announced
- [ ] Close button labeled
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Loading state announced

#### Keyboard Navigation (Desktop/Tablet)
- [ ] Tab key navigates through buttons
- [ ] Enter/Space activates buttons
- [ ] Escape closes modal
- [ ] Focus indicators visible
- [ ] Tab order is logical

#### Color Contrast
- [ ] Run WAVE or axe DevTools
- [ ] No contrast errors reported
- [ ] All text meets AA standard (4.5:1)
- [ ] Dark mode meets standards

## Bug Checklist

### Critical Issues
- [ ] Modal doesn't freeze app
- [ ] Keyboard dismisses properly
- [ ] No JavaScript errors in console
- [ ] No duplicate data displays
- [ ] Error states recover properly

### Medium Issues
- [ ] Animation jank on slow devices
- [ ] Keyboard shift layout on iOS
- [ ] Content overflow on narrow screens
- [ ] Date picker not respecting locale

### Minor Issues
- [ ] Icon alignment slightly off
- [ ] Spacing inconsistency
- [ ] Transition timing slightly off
- [ ] Focus ring styling

## Automated Testing Commands

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Check bundle size
npm run build -- --analyze

# Run tests
composer run test
```

## Real Device Testing Notes

### iOS (iPhone SE / iPhone 12+)
- Test on iOS 14+ (minimum)
- Check landscape orientation
- Test keyboard safe area behavior
- Test Face ID availability (if applicable)
- Check Push notification behavior

### Android (Various versions)
- Test Android 8+ (minimum)
- Check navigation bar behavior
- Test back button handling
- Verify system font scaling
- Check gesture navigation compatibility

## Browser Testing Matrix

| Browser | iOS | Android | Desktop |
|---------|-----|---------|---------|
| Safari | ✓ | - | ✓ |
| Chrome | - | ✓ | ✓ |
| Firefox | - | ✓ | ✓ |
| Samsung Internet | - | ✓ | - |
| Firefox Focus | - | ✓ | - |

## Regression Testing

After updates, test these critical paths:
1. View transaction details modal
2. Pull-to-refresh transaction list
3. Enter dates with keyboard
4. Toggle dark mode
5. Go offline and back online
6. Close and reopen modal multiple times
7. Rotate device orientation
8. Test with system font scaling at 120%

## Performance Benchmarks

Target metrics:
- Modal open time: < 300ms
- First Paint: < 2s (3G)
- Pull-to-refresh response: < 100ms
- Date picker open: < 200ms (native)
- LCP (Largest Contentful Paint): < 3s

## Sign-Off Checklist

- [ ] All critical issues resolved
- [ ] Tested on at least one iOS device
- [ ] Tested on at least one Android device
- [ ] Tested in both light and dark mode
- [ ] Keyboard handling works smoothly
- [ ] No console errors
- [ ] PWA installable
- [ ] Offline mode functional
- [ ] Performance acceptable

## Support Notes

### Common Issues and Solutions

**Issue: Keyboard doesn't dismiss**
- Solution: Check `e.preventDefault()` is called
- Verify blur() is actually called in DevTools

**Issue: Modal appears but behind other content**
- Solution: Check z-index (should be 50)
- Verify no parent has `overflow: hidden`

**Issue: Bottom sheet doesn't slide**
- Solution: Check Tailwind classes loaded
- Verify CSS is compiled correctly

**Issue: Date picker shows wrong locale**
- Solution: Set `lang` attribute on html element
- Browser uses system locale by default

**Issue: Service worker not caching**
- Solution: Check manifest.json path is correct
- Verify service-worker.js registered in app.blade.php
- Clear browser cache and re-register
