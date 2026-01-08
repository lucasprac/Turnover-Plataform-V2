/**
 * Interpretability Types for Bayesian Analysis
 */

// =============================================================================
// PARAMETER BELIEFS (from /bayesian/parameter-beliefs)
// =============================================================================

export interface ParameterStats {
    name: string;
    mean: number;
    std: number;
    median: number;
    ci_95: [number, number];
    ci_50: [number, number];
    samples: number[];
    effect_direction?: 'positive' | 'negative' | 'uncertain';
}

export interface ParameterBeliefsResponse {
    intercept: ParameterStats;
    tau: ParameterStats;
    coefficients: ParameterStats[];
    n_posterior_samples: number;
}

// =============================================================================
// UNCERTAINTY DECOMPOSITION (from /bayesian/uncertainty-decomposition)
// =============================================================================

export interface UncertaintyObservation {
    obs_index: number;
    mean_probability: number;
    total_uncertainty: number;
    epistemic_uncertainty: number;
    aleatoric_uncertainty: number;
    entropy: number;
    confidence: number;
    uncertainty_ratio: number;
}

export interface UncertaintyAggregate {
    mean_epistemic: number;
    mean_aleatoric: number;
    mean_confidence: number;
}

export interface UncertaintyDecompositionResponse {
    observations: UncertaintyObservation[];
    aggregate: UncertaintyAggregate;
}

// =============================================================================
// PPC - POSTERIOR PREDICTIVE CHECKING (from /bayesian/ppc)
// =============================================================================

export interface DiscrepancyMeasure {
    observed: number;
    replicated_mean: number;
    replicated_std: number;
    replicated_ci_95: [number, number];
    p_value: number;
}

export interface PPCIssue {
    statistic: string;
    p_value: number;
    interpretation: string;
}

export interface ModelCheckSummary {
    overall_fit: 'good' | 'potential_issues';
    summary: string;
    issues: PPCIssue[];
    recommendation: string;
}

export interface PPCResponse {
    discrepancy_measures: Record<string, DiscrepancyMeasure>;
    ppc_p_values: Record<string, number>;
    model_check_summary: ModelCheckSummary;
    n_replications: number;
    n_observations: number;
}
