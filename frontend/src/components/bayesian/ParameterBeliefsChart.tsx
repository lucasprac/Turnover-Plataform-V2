import React from 'react';
import { ParameterBeliefsResponse, ParameterStats } from '@/types/interpretability';

interface ParameterBeliefsChartProps {
    data: ParameterBeliefsResponse | null;
    isLoading?: boolean;
    error?: string | null;
}

/**
 * Ridge plot visualization for Bayesian parameter beliefs.
 * Shows posterior distributions for each coefficient with credible intervals.
 */
export function ParameterBeliefsChart({ data, isLoading, error }: ParameterBeliefsChartProps) {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4 p-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-2">⚠️ Error loading parameter beliefs</div>
                <div className="text-sm text-gray-500">{error}</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center text-gray-500">
                No data available. Please train the Bayesian model first.
            </div>
        );
    }

    const { coefficients, n_posterior_samples } = data;

    // Color based on effect direction
    const getDirectionColor = (direction: string | undefined) => {
        switch (direction) {
            case 'positive': return { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', fill: '#3b82f6' };
            case 'negative': return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', fill: '#ef4444' };
            default: return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600', fill: '#9ca3af' };
        }
    };

    const formatCI = (ci: [number, number]) =>
        `[${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]`;

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Parameter Posterior Distributions</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {n_posterior_samples} samples
                </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-6 text-xs">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-400 rounded" />
                    <span className="text-gray-600">Positive effect</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-400 rounded" />
                    <span className="text-gray-600">Negative effect</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-400 rounded" />
                    <span className="text-gray-600">Uncertain</span>
                </div>
            </div>

            {/* Ridge Plots */}
            <div className="space-y-3">
                {coefficients.slice(0, 15).map((coef, idx) => (
                    <RidgePlotRow key={coef.name} coef={coef} rank={idx + 1} />
                ))}
            </div>

            {coefficients.length > 15 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Showing top 15 of {coefficients.length} coefficients (sorted by effect size)
                </div>
            )}
        </div>
    );
}

interface RidgePlotRowProps {
    coef: ParameterStats;
    rank: number;
}

function RidgePlotRow({ coef, rank }: RidgePlotRowProps) {
    const colors = getDirectionColors(coef.effect_direction);

    // Normalize samples for visualization
    const samples = coef.samples || [];
    const min = Math.min(...samples, coef.ci_95[0]);
    const max = Math.max(...samples, coef.ci_95[1]);
    const range = max - min || 1;

    // Create histogram bins for density visualization
    const numBins = 30;
    const binWidth = range / numBins;
    const bins = Array(numBins).fill(0);

    samples.forEach(s => {
        const binIdx = Math.min(Math.floor((s - min) / binWidth), numBins - 1);
        if (binIdx >= 0 && binIdx < numBins) bins[binIdx]++;
    });

    const maxBin = Math.max(...bins, 1);

    // Position calculations for markers (as percentages)
    const meanPos = ((coef.mean - min) / range) * 100;
    const ci95Left = ((coef.ci_95[0] - min) / range) * 100;
    const ci95Width = ((coef.ci_95[1] - coef.ci_95[0]) / range) * 100;
    const ci50Left = ((coef.ci_50[0] - min) / range) * 100;
    const ci50Width = ((coef.ci_50[1] - coef.ci_50[0]) / range) * 100;

    // Zero line position
    const zeroPos = min <= 0 && max >= 0 ? ((0 - min) / range) * 100 : null;

    return (
        <div className={`relative rounded-lg border ${colors.border} ${colors.bg} p-3`}>
            <div className="flex items-center gap-4">
                {/* Rank badge */}
                <div className="w-6 h-6 flex items-center justify-center text-xs font-semibold bg-white rounded-full shadow-sm">
                    {rank}
                </div>

                {/* Feature name */}
                <div className="w-48 truncate">
                    <span className={`font-medium ${colors.text}`}>{formatFeatureName(coef.name)}</span>
                </div>

                {/* Ridge plot visualization */}
                <div className="flex-1 relative h-10">
                    {/* Histogram bars */}
                    <div className="absolute inset-0 flex items-end">
                        {bins.map((count, i) => (
                            <div
                                key={i}
                                className="flex-1"
                                style={{
                                    height: `${(count / maxBin) * 100}%`,
                                    backgroundColor: colors.fill,
                                    opacity: 0.3
                                }}
                            />
                        ))}
                    </div>

                    {/* 95% CI band */}
                    <div
                        className="absolute h-full opacity-40"
                        style={{
                            left: `${ci95Left}%`,
                            width: `${ci95Width}%`,
                            backgroundColor: colors.fill
                        }}
                    />

                    {/* 50% CI band */}
                    <div
                        className="absolute h-full opacity-60"
                        style={{
                            left: `${ci50Left}%`,
                            width: `${ci50Width}%`,
                            backgroundColor: colors.fill
                        }}
                    />

                    {/* Zero line */}
                    {zeroPos !== null && (
                        <div
                            className="absolute h-full w-px bg-gray-800"
                            style={{ left: `${zeroPos}%` }}
                        />
                    )}

                    {/* Mean marker */}
                    <div
                        className="absolute h-full w-0.5 bg-gray-900"
                        style={{ left: `${meanPos}%` }}
                    />
                </div>

                {/* Statistics */}
                <div className="text-right text-xs space-y-0.5 w-32">
                    <div className={`font-semibold ${colors.text}`}>
                        μ = {coef.mean.toFixed(3)}
                    </div>
                    <div className="text-gray-500">
                        σ = {coef.std.toFixed(3)}
                    </div>
                </div>

                {/* Direction indicator */}
                <div className="w-6">
                    {coef.effect_direction === 'positive' && (
                        <span className="text-blue-500 text-lg">↑</span>
                    )}
                    {coef.effect_direction === 'negative' && (
                        <span className="text-red-500 text-lg">↓</span>
                    )}
                    {coef.effect_direction === 'uncertain' && (
                        <span className="text-gray-400 text-lg">?</span>
                    )}
                </div>
            </div>

            {/* Tooltip on hover - 95% CI */}
            <div className="mt-1 text-xs text-gray-500">
                95% CI: [{coef.ci_95[0].toFixed(3)}, {coef.ci_95[1].toFixed(3)}]
            </div>
        </div>
    );
}

function getDirectionColors(direction: string | undefined) {
    switch (direction) {
        case 'positive': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', fill: '#3b82f6' };
        case 'negative': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', fill: '#ef4444' };
        default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', fill: '#9ca3af' };
    }
}

function formatFeatureName(name: string): string {
    // Clean up feature names for display
    return name
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 25);
}

export default ParameterBeliefsChart;
