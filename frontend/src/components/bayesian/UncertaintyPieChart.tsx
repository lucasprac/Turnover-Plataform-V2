import React from 'react';
import { UncertaintyDecompositionResponse } from '@/types/interpretability';
import { CheckCircle2 } from 'lucide-react';

interface UncertaintyPieChartProps {
    data: UncertaintyDecompositionResponse | null;
    isLoading?: boolean;
    error?: string | null;
}

/**
 * Pie chart showing decomposition of prediction uncertainty.
 * Epistemic (reducible) vs Aleatoric (irreducible) uncertainty.
 */
export function UncertaintyPieChart({ data, isLoading, error }: UncertaintyPieChartProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-2">⚠️ Error loading uncertainty data</div>
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

    const { aggregate } = data;
    const total = aggregate.mean_epistemic + aggregate.mean_aleatoric;
    const epistemicPct = total > 0 ? (aggregate.mean_epistemic / total) * 100 : 50;
    const aleatoricPct = total > 0 ? (aggregate.mean_aleatoric / total) * 100 : 50;

    // Calculate SVG arc paths for pie chart
    const epistemicAngle = (epistemicPct / 100) * 360;
    const aleatoricAngle = (aleatoricPct / 100) * 360;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Uncertainty Decomposition</h3>
                <p className="text-sm text-gray-500 mt-1">
                    How much uncertainty can be reduced with more data?
                </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {/* Pie Chart */}
                <div className="relative">
                    <svg viewBox="0 0 200 200" className="w-56 h-56">
                        <defs>
                            <linearGradient id="epistemicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                            <linearGradient id="aleatoricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                        </defs>

                        {/* Background circle */}
                        <circle cx="100" cy="100" r="80" fill="#f3f4f6" />

                        {/* Epistemic slice */}
                        <PieSlice
                            cx={100}
                            cy={100}
                            radius={80}
                            startAngle={-90}
                            endAngle={-90 + epistemicAngle}
                            fill="url(#epistemicGrad)"
                        />

                        {/* Aleatoric slice */}
                        <PieSlice
                            cx={100}
                            cy={100}
                            radius={80}
                            startAngle={-90 + epistemicAngle}
                            endAngle={-90 + 360}
                            fill="url(#aleatoricGrad)"
                        />

                        {/* Center circle with confidence */}
                        <circle cx="100" cy="100" r="50" fill="white" />
                        <text x="100" y="92" textAnchor="middle" className="text-2xl font-bold" fill="#374151">
                            {(aggregate.mean_confidence * 100).toFixed(0)}%
                        </text>
                        <text x="100" y="112" textAnchor="middle" className="text-xs" fill="#6b7280">
                            Confidence
                        </text>
                    </svg>
                </div>

                {/* Legend and explanations */}
                <div className="space-y-6">
                    {/* Epistemic */}
                    <div className="flex items-start gap-3">
                        <div className="w-4 h-4 mt-1 rounded bg-gradient-to-br from-blue-500 to-blue-700" />
                        <div>
                            <div className="font-semibold text-gray-900">
                                Epistemic: {epistemicPct.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                                Reducible uncertainty from limited data
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                                → Can improve with more training data
                            </div>
                        </div>
                    </div>

                    {/* Aleatoric */}
                    <div className="flex items-start gap-3">
                        <div className="w-4 h-4 mt-1 rounded bg-gradient-to-br from-amber-500 to-amber-600" />
                        <div>
                            <div className="font-semibold text-gray-900">
                                Aleatoric: {aleatoricPct.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                                Irreducible randomness in outcomes
                            </div>
                            <div className="text-xs text-amber-600 mt-1">
                                → Inherent unpredictability
                            </div>
                        </div>
                    </div>

                    {/* Interpretation */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                        {epistemicPct > 50 ? (
                            <span className="text-blue-700">
                                💡 High epistemic ratio suggests more data could significantly improve predictions
                            </span>
                        ) : (
                            <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Model has captured most reducible uncertainty
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Metrics bar */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-700">
                        {(aggregate.mean_epistemic * 1000).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Epistemic (×10³)</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="text-xl font-bold text-amber-700">
                        {(aggregate.mean_aleatoric * 1000).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Aleatoric (×10³)</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="text-xl font-bold text-emerald-700">
                        {(aggregate.mean_confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Mean Confidence</div>
                </div>
            </div>
        </div>
    );
}

interface PieSliceProps {
    cx: number;
    cy: number;
    radius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
}

function PieSlice({ cx, cy, radius, startAngle, endAngle, fill }: PieSliceProps) {
    // Handle full circle case
    if (Math.abs(endAngle - startAngle) >= 360) {
        return <circle cx={cx} cy={cy} r={radius} fill={fill} />;
    }

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    const d = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
    ].join(' ');

    return <path d={d} fill={fill} />;
}

export default UncertaintyPieChart;
