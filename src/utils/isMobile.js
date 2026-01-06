/**
 * Detect if the current device is a mobile device
 * Uses User-Agent string and screen width check
 */
export function isMobile() {
    // Check User-Agent for mobile patterns
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    const userAgentMatch = mobileRegex.test(navigator.userAgent);

    // Also check screen width as a fallback
    const isNarrowScreen = window.innerWidth <= 768;

    return userAgentMatch || isNarrowScreen;
}

/**
 * Check if we should redirect to mobile routes
 * Only redirect if:
 * 1. User is on mobile device
 * 2. Not already on mobile route
 * 3. Not on admin/dashboard routes (admins may need desktop features)
 */
export function shouldRedirectToMobile() {
    if (!isMobile()) return false;

    const path = window.location.pathname;

    // Already on mobile route
    if (path.startsWith('/m')) return false;

    // Don't redirect dashboard/admin routes
    if (path.startsWith('/dashboard')) return false;

    // Don't redirect setup or login
    if (path === '/setup' || path === '/login') return false;

    return true;
}
