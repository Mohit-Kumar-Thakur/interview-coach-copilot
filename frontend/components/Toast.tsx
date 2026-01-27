"use client";

import { useEffect, useState } from "react";
import { onToast, type ToastMessage } from "@/lib/toast";

export default function Toast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        // Subscribe to toast events
        const unsubscribe = onToast((toast) => {
            setToasts((prev) => [...prev, toast]);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 5000);
        });

        return unsubscribe;
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="min-w-[300px] max-w-md rounded-lg border px-4 py-3 shadow-lg animate-slide-up"
                    style={{
                        background: toast.type === 'error'
                            ? 'rgb(var(--danger) / 0.1)'
                            : toast.type === 'success'
                                ? 'rgb(var(--primary) / 0.1)'
                                : 'rgb(var(--muted))',
                        borderColor: toast.type === 'error'
                            ? 'rgb(var(--danger) / 0.3)'
                            : toast.type === 'success'
                                ? 'rgb(var(--primary) / 0.3)'
                                : 'rgb(var(--border))',
                        color: toast.type === 'error'
                            ? 'rgb(var(--danger))'
                            : toast.type === 'success'
                                ? 'rgb(var(--primary))'
                                : 'rgb(var(--text))',
                    }}
                >
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                            {toast.type === 'error' && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            {toast.type === 'success' && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {toast.type === 'info' && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>

                        {/* Message */}
                        <div className="flex-1">
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
