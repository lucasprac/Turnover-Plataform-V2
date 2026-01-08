import React, { useEffect, useState } from 'react';

interface ComputationWarningProps {
    mode: 'nuts';
    isComputing: boolean;
    onCancel?: () => void;
}

/**
 * Warning notification about computational overhead for Bayesian analysis
 */
export function ComputationWarning({ mode, isComputing, onCancel }: ComputationWarningProps) {
    const [elapsedTime, setElapsedTime] = useState(0);

    // Timer for elapsed time
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isComputing) {
            setElapsedTime(0);
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 0.1);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isComputing]);

    const estimates = {
        nuts: { min: 10, max: 30 }
    };

    const estimate = estimates[mode];

    if (!isComputing) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
                {/* Spinner */}
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">
                    Computing Bayesian uncertainty... ({elapsedTime.toFixed(1)}s)
                </span>
            </div>

            {onCancel && (
                <button
                    onClick={onCancel}
                    className="px-3 py-1 text-xs font-medium text-amber-700 hover:text-amber-900 border border-amber-300 rounded hover:bg-amber-100 transition-colors"
                >
                    Cancel
                </button>
            )}
        </div>
    );
}

export default ComputationWarning;
