import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for pull-to-refresh functionality
 * Works on mobile and touch devices
 */
export function usePullToRefresh(onRefresh) {
    const containerRef = useRef(null);
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startYRef = useRef(0);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e) => {
            const scrollTop = container.scrollTop;
            
            // Only start pull-to-refresh if at the top of the scroll container
            if (scrollTop === 0) {
                startYRef.current = e.touches[0].clientY;
                setIsPulling(true);
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling || isRefreshingRef.current) return;

            const currentY = e.touches[0].clientY;
            const distance = currentY - startYRef.current;

            if (distance > 0) {
                e.preventDefault();
                setPullDistance(distance);
            }
        };

        const handleTouchEnd = async () => {
            setIsPulling(false);

            // Trigger refresh if pulled down more than 80px
            if (pullDistance > 80 && !isRefreshingRef.current) {
                isRefreshingRef.current = true;
                try {
                    await onRefresh();
                } finally {
                    isRefreshingRef.current = false;
                    setPullDistance(0);
                }
            } else {
                setPullDistance(0);
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, onRefresh]);

    return { containerRef, pullDistance, isPulling: isRefreshingRef.current };
}
