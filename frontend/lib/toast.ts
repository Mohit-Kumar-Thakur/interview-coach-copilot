/**
 * Simple event-based toast notification system
 * No complex state management needed - uses custom events
 */

export type ToastType = 'success' | 'error' | 'info';

export type ToastMessage = {
    id: string;
    message: string;
    type: ToastType;
};

// Event name for toast notifications
const TOAST_EVENT = 'app-toast';

/**
 * Show a toast notification
 * @param message - Message to display
 * @param type - Type of toast (success, error, info)
 */
export function showToast(message: string, type: ToastType = 'info') {
    if (typeof window === 'undefined') return;

    const toast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        message,
        type,
    };

    // Dispatch custom event with toast data
    window.dispatchEvent(
        new CustomEvent(TOAST_EVENT, { detail: toast })
    );
}

/**
 * Subscribe to toast events
 * @param callback - Function to call when toast is triggered
 * @returns Cleanup function to remove listener
 */
export function onToast(callback: (toast: ToastMessage) => void) {
    if (typeof window === 'undefined') return () => { };

    const handler = (event: Event) => {
        const customEvent = event as CustomEvent<ToastMessage>;
        callback(customEvent.detail);
    };

    window.addEventListener(TOAST_EVENT, handler);

    return () => {
        window.removeEventListener(TOAST_EVENT, handler);
    };
}
