import React from 'react';

export default function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
            <div className="relative w-32 h-32">
                {/* Outer radar circle */}
                <span className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-75 animate-radar"></span>
                {/* Inner pulsing dot */}
                <span className="absolute inset-0 m-auto w-6 h-6 bg-blue-400 rounded-full animate-pulse"></span>
            </div>
        </div>
    );
}
