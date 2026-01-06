/**
 * Format a date string or object to Beijing Time (UTC+8) string
 * @param {string|Date|number} date - The date to format
 * @returns {string} - Formatted date string in zh-CN locale and Asia/Shanghai timezone
 */
export const formatDate = (date) => {
    if (!date) return '';
    try {
        return new Date(date).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        });
    } catch (e) {
        console.error('Date formatting error:', e);
        return String(date);
    }
};

/**
 * Format a date string or object to Beijing Date (UTC+8) string (YYYY/MM/DD)
 * @param {string|Date|number} date - The date to format
 * @returns {string} - Formatted date string in zh-CN locale and Asia/Shanghai timezone
 */
export const formatDateOnly = (date) => {
    if (!date) return '';
    try {
        return new Date(date).toLocaleDateString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Date formatting error:', e);
        return String(date);
    }
};

/**
 * Get current Beijing Time as Date object
 * Useful if you need to do date calculations in Beijing time context, 
 * though native Date object is always UTC timestamp internally.
 * This returns a string by default if no params, but here we just export the formatter.
 */
