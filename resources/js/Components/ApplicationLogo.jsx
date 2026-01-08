export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Document background */}
            <rect x="24" y="16" width="80" height="96" rx="8" fill="#E8E8FF" />
            
            {/* Document lines */}
            <line x1="36" y1="32" x2="92" y2="32" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            <line x1="36" y1="48" x2="92" y2="48" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            <line x1="36" y1="64" x2="92" y2="64" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            <line x1="36" y1="80" x2="72" y2="80" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            
            {/* Checkbox circle background */}
            <circle cx="76" cy="88" r="16" fill="#6366F1" />
            
            {/* Checkmark */}
            <path d="M70 88 L74 92 L82 84" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

