export default function Alert({ type = 'info', message, className = '' }) {
    const bgColor = {
        success: 'bg-green-50 border border-green-200',
        error: 'bg-red-50 border border-red-200',
        warning: 'bg-yellow-50 border border-yellow-200',
        info: 'bg-blue-50 border border-blue-200',
    }[type];

    const textColor = {
        success: 'text-green-700',
        error: 'text-red-700',
        warning: 'text-yellow-700',
        info: 'text-blue-700',
    }[type];

    return (
        <div className={`p-4 rounded-lg ${bgColor} ${className}`}>
            <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
    );
}
