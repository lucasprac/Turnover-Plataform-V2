export interface EmployeeSummary {
    id: string;
    name: string;
    role: string;
    tenure_months: number;
}

export interface IndividualPrediction {
    turnover_probability: number;
    shap_values: { feature: string; value: number; formatted_value?: string }[];
    contributions: { feature: string; value: number; formatted_value?: string }[];
    grouped_contributions?: { feature: string; value: number; formatted_value?: string }[];
    risk_level: 'High' | 'Low';
}

export interface AggregatePrediction {
    predicted_turnover_count: number;
    total_in_cohort: number;
    cohort_risk_rate: number;
    shap_values?: { feature: string; value: number }[];
    contributions?: { feature: string; value: number }[];
}

export interface AggregateFilters {
    education_level: string | null;
    gender: string | null;
    age_group: string | null;
    tenure_group: string | null;
}

// =============================================================================
// BAYESIAN PREDICTION TYPES
// =============================================================================

export interface CredibleIntervals {
    ci_50: [number, number];
    ci_80: [number, number];
    ci_95: [number, number];
}

export interface BayesianUncertainty {
    mean: number;
    std: number;
    credible_intervals: CredibleIntervals;
    samples: number[];
    risk_band: 'High' | 'Medium' | 'Low' | 'Uncertain';
}

export interface BayesianIndividualPrediction {
    mean: number;
    std: number;
    credible_intervals: CredibleIntervals;
    samples: number[];
    risk_band: 'High' | 'Medium' | 'Low' | 'Uncertain';
    computation_time?: number;
    method?: string;
}

export interface BayesianAggregatePrediction {
    predicted_turnover_count: number;
    total_in_cohort: number;
    cohort_risk_rate: number;
    uncertainty: BayesianUncertainty;
    computation_time?: number;
    method?: string;
}

export type PredictionSystem = 'xgboost' | 'bayesian';

export interface ModelMetrics {
    one_year?: {
        accuracy: number;
        roc_auc: number;
        f1_score: number;
        rmse: number;
    };
    five_year?: {
        mae: number;
        rmse: number;
        r2_score: number;
    };
}

// =============================================================================
// SHAPASH VISUALIZATION TYPES
// =============================================================================

export interface FeatureContribution {
    feature: string;
    value: number;
    base_value?: number;
    formatted_value?: string;
}

export interface GroupedShap {
    group: string;
    value: number;
}

export interface FeatureGroupData {
    name: string;
    features: FeatureContribution[];
    totalImportance: number;
    color: string;
}

export interface ContributionDataPoint {
    featureValue: number | string;
    contribution: number;
    prediction: number;
    label?: string;
}

export interface CompacityData {
    features: string[];
    cumulativeImportance: number[];
    targetAccuracy: number;
    featuresNeeded: number;
}

export interface FeatureInteraction {
    feature1: string;
    feature2: string;
    interactionStrength: number;
}

export interface TurnoverAnalysis {
    month: string;
    predicted_turnover: number;
    historical_turnover: number;
    confidence_lower: number;
    confidence_upper: number;
}

export interface DashboardMetrics {
    total_employees: number;
    turnover_rate: number;
    turnover_risk_high: number;
    avg_satisfaction: number;
}

export interface TopRiskEmployee {
    id: string;
    name: string;
    risk: number;
}

export interface DashboardData {
    metrics: DashboardMetrics;
    shap_values: FeatureContribution[];
    grouped_shap: GroupedShap[];
    predictions: TopRiskEmployee[];
    feature_importance: { feature: string; importance: number }[];
    turnover_analysis: TurnoverAnalysis[];
}
