/**
 * Format currency values to EUR locale
 */
export const formatCurrency = (value, currency = 'EUR') => {
    return new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: currency,
    }).format(value);
};

/**
 * Format ISO date string to Greek locale (DD/MM/YYYY)
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

/**
 * Format ISO date string to short format (DD/MM/YYYY)
 */
export const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};
