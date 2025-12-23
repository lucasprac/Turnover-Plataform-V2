
# Feature group definitions for Turnover prediction analysis
# These groups are used for structured SHAP analysis and reporting.

FEATURE_GROUPS = {
    "Demographic": [
        "a1_gender",
        "a2_age",
        "a3_number_of_children",
        "a4_children_under_18_years",
        "a5_age_youngest_children",
        "a6_education_level",
        "B2_Public_service_status_ger"
    ],
    "Professional": [
        "B1_commute_distance_in_km",
        "B3_early_retirement_rate",
        "B4_sickness_days",
        "B5_Degree_of_employment",
        "B6_gross_working_days",
        "B7_Vacation_days",
        "B8_net_working_days",
        "B9_salary_increase_last_year",
        "B10_Tenure_in_month",
        "B11_salary_today_brl",
        "B12_salary_increase_last_5_years",
        "B13_Parental_leave",
        "B14_Cargo",
        "B15_Sector",
        "B16_Headquarters",
        "D1_monthly_unemployment_rate_brazil",
        "D2_monthly_number_of_vacancies",
        "D3_monthly_short_time_workers"
    ],
    "Performance & Engagement": [
        "b1_PDI_rate",
        "c1_overall_employee_satisfaction",
        "c2_employee_satisfaction_moving_average",
        "M_eNPS",
        "M_Onboarding_Final_Score"
        # Onboarding and Climate features are also dynamically added in preprocessor
    ]
}

# Sub-prefixes that belong to Performance & Engagement
ENGAGEMENT_PREFIXES = ["M_", "Climate_"]
