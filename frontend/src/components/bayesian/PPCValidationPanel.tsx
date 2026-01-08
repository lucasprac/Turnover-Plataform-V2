import React from 'react';
import { PPCResponse } from '@/types/interpretability';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface PPCValidationPanelProps {
    data: PPCResponse | null;
    isLoading?: boolean;
    error?: string | null;
}

/**
 * Panel displaying Posterior Predictive Checking results for model validation.
 * Shows discrepancy measures, p-values, and fit assessment.
 */
export function PPCValidationPanel({ data, isLoading, error }: PPCValidationPanelProps) {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4 p-6">
                <div className="h-16 bg-gray-200 rounded" />
                <div className="h-40 bg-gray-200 rounded" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-2">⚠️ Error running PPC</div>
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

    const { discrepancy_measures, model_check_summary, n_replications, n_observations } = data;
    const isGoodFit = model_check_summary.overall_fit === 'good';

    // Helper to determine p-value status
    const getPValueStatus = (p: number) => {
        if (p >= 0.1 && p <= 0.9) return { color: 'text-emerald-600', bg: 'bg-emerald-50', status: 'good' };
        if (p >= 0.05 && p <= 0.95) return { color: 'text-amber-600', bg: 'bg-amber-50', status: 'warning' };
        return { color: 'text-red-600', bg: 'bg-red-50', status: 'bad' };
    };

    const formatStatName = (name: string) => {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Posterior Predictive Checking</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{n_replications} replications</span>
                    <span>•</span>
                    <span>{n_observations} observations</span>
                </div>
            </div>

            {/* Overall Fit Banner */}
            <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${isGoodFit ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                {isGoodFit ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                    <div className={`font-semibold ${isGoodFit ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {isGoodFit ? 'Model Passes PPC Checks' : 'Potential Issues Detected'}
                    </div>
                    <div className={`text-sm ${isGoodFit ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {model_check_summary.summary}
                    </div>
                </div>
            </div>

            {/* Explanation Box */}
            <div className="p-3 bg-gray-50 rounded-lg mb-6 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600">
                    <strong>Interpretation:</strong> p-values near 0.5 indicate good fit.
                    Values close to 0 or 1 suggest the model may not capture that aspect of the data well.
                </div>
            </div>

            {/* Discrepancy Measures Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Statistic</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700">Observed</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700">Replicated (Mean ± SD)</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">p-value</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Object.entries(discrepancy_measures).map(([name, measure]) => {
                            const pStatus = getPValueStatus(measure.p_value);
                            return (
                                <tr key={name} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {formatStatName(name)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700 font-mono">
                                        {measure.observed.toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600 font-mono">
                                        {measure.replicated_mean.toFixed(4)} ± {measure.replicated_std.toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded font-mono text-xs ${pStatus.bg} ${pStatus.color}`}>
                                            {measure.p_value.toFixed(3)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {pStatus.status === 'good' && (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                                        )}
                                        {pStatus.status === 'warning' && (
                                            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                                        )}
                                        {pStatus.status === 'bad' && (
                                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Issues List (if any) */}
            {model_check_summary.issues.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Detected Issues</h4>
                    <div className="space-y-2">
                        {model_check_summary.issues.map((issue, idx) => (
                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                                <span className="font-medium text-red-800">{formatStatName(issue.statistic)}:</span>
                                <span className="text-red-700 ml-1">{issue.interpretation}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendation */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800 mb-1">Recommendation</div>
                <div className="text-sm text-blue-700">{model_check_summary.recommendation}</div>
            </div>

            {/* P-value interpretation guide */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-700">0.1 - 0.9: Good fit</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700">0.05 - 0.95: Monitor</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">&lt;0.05 or &gt;0.95: Issue</span>
                </div>
            </div>
        </div>
    );
}

export default PPCValidationPanel;
