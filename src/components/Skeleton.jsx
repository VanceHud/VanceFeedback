import React from 'react';

export default function Skeleton({ className = '', width, height, style }) {
    return (
        <div
            className={`bg-slate-200 animate-pulse rounded-md ${className}`}
            style={{
                width,
                height,
                ...style
            }}
        />
    );
}
