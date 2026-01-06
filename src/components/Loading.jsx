import React from 'react';

export default function Loading({ variant = 'inline', text, className = '' }) {
    if (variant === 'fullscreen') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 fixed inset-0 z-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                    {text && <p className="text-slate-600 text-lg animate-pulse">{text}</p>}
                </div>
            </div>
        );
    }

    if (variant === 'section') {
        return (
            <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                {text && <p className="mt-4 text-slate-500 text-sm animate-pulse">{text}</p>}
            </div>
        );
    }

    // inline
    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {text && <span>{text}</span>}
        </div>
    );
}
