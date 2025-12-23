
"""
Shapash Configuration
Centralizes feature mapping, grouping, and post-processing logic.
"""

# Dictionary mapping technical feature names to business-friendly names
FEATURES_DICT = {
    # Personal / Demographic
    'a2_age': 'Age',
    'a1_gender': 'Gender', 
    'a6_education_level': 'Education Level',
    'a3_number_of_children': 'Number of Children',
    'a4_children_under_18_years': 'Children (<18y)',
    'a5_age_youngest_children': 'Age of Youngest Child',
    
    # Professional / Contractual
    'B1_commute_distance_in_km': 'Commute Distance',
    'B2_Public_service_status_ger': 'Public Service Status',
    'B3_early_retirement_rate': 'Early Retirement Rate',
    'B4_sickness_days': 'Sickness Days',
    'B5_Degree_of_employment': 'Employment Degree', 
    'B6_gross_working_days': 'Gross Working Days', 
    'B7_Vacation_days': 'Vacation Days', 
    'B8_net_working_days': 'Net Working Days',
    'B9_salary_increase_last_year': 'Salary Increase (Last Year)',
    'B10_Tenure_in_month': 'Tenure (Months)',
    'B11_salary_today_brl': 'Monthly Salary', 
    'B12_salary_increase_last_5_years': 'Salary Increase (5 Years)', 
    'B13_Parental_leave': 'Parental Leave',
    'B14_Cargo': 'Role', 
    'B15_Sector': 'Department', 
    'B16_Headquarters': 'Location',
    
    # Performance & Satisfaction
    'b1_PDI_rate': 'PDI Completion Rate',
    'c1_overall_employee_satisfaction': 'Satisfaction Score',
    'c2_employee_satisfaction_moving_average': 'Satisfaction (Moving Avg)',
    'M_Onboarding_Final_Score': 'Onboarding Score',
    'M_eNPS': 'eNPS Score',
    
    # Macro Indicators
    'D1_monthly_unemployment_rate_brazil': 'Unemployment Rate (BR)', 
    'D2_monthly_number_of_vacancies': 'Market Vacancies', 
    'D3_monthly_short_time_workers': 'Short-time Workers'
}

# Feature groupings for easier analysis
FEATURES_GROUPS = {
    'Demographics': [
        'a2_age', 'a1_gender', 'a6_education_level', 
        'a3_number_of_children', 'a4_children_under_18_years', 
        'a5_age_youngest_children'
    ],
    'Job Details': [
        'B10_Tenure_in_month', 'B14_Cargo', 'B15_Sector', 
        'B16_Headquarters', 'B5_Degree_of_employment',
        'B1_commute_distance_in_km'
    ],
    'Compensation': [
        'B11_salary_today_brl', 'B9_salary_increase_last_year',
        'B12_salary_increase_last_5_years'
    ],
    'Performance & Satisfaction': [
        'c1_overall_employee_satisfaction', 'c2_employee_satisfaction_moving_average',
        'b1_PDI_rate', 'M_eNPS', 'M_Onboarding_Final_Score'
    ],
    'Attendance': [
        'B4_sickness_days', 'B7_Vacation_days', 
        'B6_gross_working_days', 'B8_net_working_days'
    ],
    'Macroeconomic': [
        'D1_monthly_unemployment_rate_brazil', 
        'D2_monthly_number_of_vacancies', 
        'D3_monthly_short_time_workers'
    ]
}

# Post-processing rules for display
POSTPROCESSING = {
    'B11_salary_today_brl': {
        'type': 'suffix',
        'rule': ' BRL'
    },
    'B10_Tenure_in_month': {
        'type': 'suffix',
        'rule': ' Months'
    },
    'a2_age': {
        'type': 'suffix',
        'rule': ' Years'
    },
    'B1_commute_distance_in_km': {
        'type': 'suffix',
        'rule': ' km'
    },
    'c1_overall_employee_satisfaction': {
        'type': 'suffix',
        'rule': ' / 10'
    }
}

# Target Label Mapping
LABEL_DICT = {
    0: 'Stay',
    1: 'Turnover'
}
