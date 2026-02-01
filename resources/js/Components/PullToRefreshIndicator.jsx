import React from 'react';

/**
 * Pull-to-Refresh visual indicator
 */
export default function PullToRefreshIndicator({ pullDistance, isRefreshing }) {
    const opacity = Math.min(pullDistance / 80, 1);
    const rotation = Math.min(pullDistance / 80, 1) * 360;

    if (pullDistance === 0 && !isRefreshing) return null;

    return (
        <div
            className="flex justify-center items-center py-4 transition-all"
            style={{
                opacity: Math.max(opacity, isRefreshing ? 1 : 0),
                height: isRefreshing ? 'auto' : `${Math.min(pullDistance, 80)}px`,
            }}
        >
            {isRefreshing ? (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Refreshing...</span>
                </div>
            ) : (
                <svg
                    className="w-6 h-6 text-gray-400 dark:text-gray-500"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
            )}
        </div>
    );
}
