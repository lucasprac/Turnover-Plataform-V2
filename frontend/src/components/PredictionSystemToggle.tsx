import React from 'react';
import { PredictionSystem } from '../types';

interface PredictionSystemToggleProps {
    value: PredictionSystem;
    onChange: (system: PredictionSystem) => void;
    disabled?: boolean;
}

/**
 * Toggle between XGBoost and Bayesian prediction systems
 */
export function PredictionSystemToggle({ value, onChange, disabled = false }: PredictionSystemToggleProps) {
    return (
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
                onClick={() => onChange('xgboost')}
                disabled={disabled}
                className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${value === 'xgboost'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>XGBoost</span>
                </div>
            </button>

            <button
                onClick={() => onChange('bayesian')}
                disabled={disabled}
                className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${value === 'bayesian'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <span>Bayesian</span>
                </div>
            </button>
        </div>
    );
}

export default PredictionSystemToggle;
