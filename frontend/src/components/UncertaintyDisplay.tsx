import React from 'react';
import { BayesianIndividualPrediction } from '../types';

interface UncertaintyDisplayProps {
    prediction: BayesianIndividualPrediction;
    showSamples?: boolean;
}

/**
 * Displays Bayesian uncertainty metrics with credible intervals
 */
export function UncertaintyDisplay({ prediction, showSamples = false }: UncertaintyDisplayProps) {
    const { mean, std, credible_intervals, risk_band, computation_time, method } = prediction;

    // Risk band colors
    const riskColors: Record<string, { bg: string; text: string; border: string }> = {
        High: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        Uncertain: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    };

    const riskStyle = riskColors[risk_band] || riskColors.Uncertain;

    // Format percentage
    const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bayesian Prediction</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border} border`}>
                    {risk_band} Risk
                </span>
            </div>

            {/* Main probability display */}
            <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900">
                    {formatPct(mean)}
                </div>
                <div className="text-sm text-gray-500">
                    Turnover Probability (±{formatPct(std)})
                </div>
            </div>

            {/* Credible Intervals Visualization */}
            <div className="relative h-8 bg-gray-100 rounded-full mb-4 overflow-hidden">
                {/* 95% CI - widest band */}
                <div
                    className="absolute h-full bg-blue-100"
                    style={{
                        left: `${credible_intervals.ci_95[0] * 100}%`,
                        width: `${(credible_intervals.ci_95[1] - credible_intervals.ci_95[0]) * 100}%`
                    }}
                />
                {/* 80% CI - middle band */}
                <div
                    className="absolute h-full bg-blue-200"
                    style={{
                        left: `${credible_intervals.ci_80[0] * 100}%`,
                        width: `${(credible_intervals.ci_80[1] - credible_intervals.ci_80[0]) * 100}%`
                    }}
                />
                {/* 50% CI - innermost band */}
                <div
                    className="absolute h-full bg-blue-400"
                    style={{
                        left: `${credible_intervals.ci_50[0] * 100}%`,
                        width: `${(credible_intervals.ci_50[1] - credible_intervals.ci_50[0]) * 100}%`
                    }}
                />
                {/* Mean marker */}
                <div
                    className="absolute w-1 h-full bg-blue-700"
                    style={{ left: `${mean * 100}%` }}
                />
            </div>

            {/* Credible Intervals Legend */}
            <div className="grid grid-cols-3 gap-2 text-xs text-center mb-4">
                <div>
                    <div className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 bg-blue-400 rounded" />
                        <span className="text-gray-600">50% CI</span>
                    </div>
                    <div className="font-medium">
                        {formatPct(credible_intervals.ci_50[0])} - {formatPct(credible_intervals.ci_50[1])}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 bg-blue-200 rounded" />
                        <span className="text-gray-600">80% CI</span>
                    </div>
                    <div className="font-medium">
                        {formatPct(credible_intervals.ci_80[0])} - {formatPct(credible_intervals.ci_80[1])}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 bg-blue-100 rounded" />
                        <span className="text-gray-600">95% CI</span>
                    </div>
                    <div className="font-medium">
                        {formatPct(credible_intervals.ci_95[0])} - {formatPct(credible_intervals.ci_95[1])}
                    </div>
                </div>
            </div>

            {/* Metadata */}
            {(computation_time || method) && (
                <div className="flex items-center justify-end gap-4 text-xs text-gray-400 border-t pt-2">
                    {method && <span>Method: {method}</span>}
                    {computation_time && <span>Computed in {computation_time.toFixed(2)}s</span>}
                </div>
            )}
        </div>
    );
}

export default UncertaintyDisplay;
