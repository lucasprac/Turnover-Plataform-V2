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
