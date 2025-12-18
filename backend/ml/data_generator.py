import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_data(n_employees=1500, seed=42):
    """
    Generates synthetic data with Early, Middle, and End variets.
    """
    np.random.seed(seed)
    random.seed(seed)

    data = []
    education_levels = ['No Degree', 'High School', 'Bachelor', 'Master', 'PhD']

    for i in range(n_employees):
        # Generate ID
        emp_id = f"EMP-{i}"

        # 1. EARLY VARIETS (Demographics, Work, External)
        
        # Demographics
        gender = np.random.choice(['Male', 'Female', 'Other'], p=[0.48, 0.51, 0.01])
        age = max(18, min(67, int(np.random.normal(38, 10))))
        
        num_children = 0
        if age > 25: num_children = max(0, min(6, np.random.poisson(1.5)))
        
        children_under_18 = 0
        if num_children > 0:
            children_under_18 = np.random.binomial(num_children, 0.6 if age < 50 else 0.1)
            
        age_youngest = np.nan
        if num_children > 0:
            max_age_child = age - 18
            if max_age_child > 0: age_youngest = np.random.randint(0, max_age_child + 1)
            
        education = np.random.choice(education_levels, p=[0.05, 0.4, 0.35, 0.15, 0.05])
        public_status = np.random.binomial(1, 0.05)

        # Work
        max_tenure = (age - 18) * 12
        tenure_months = min(max_tenure, int(np.random.exponential(60)))
        
        commute_km = round(min(200, np.random.lognormal(2, 1)), 1)
        
        early_retirement_rate = 0.0
        if age > 55: early_retirement_rate = float(np.random.beta(2, 5))
        
        sickness_days = int(np.random.poisson(5))
        if age > 50: sickness_days += int(np.random.poisson(3))
        
        degree_employment = float(np.random.choice([0.5, 0.75, 1.0], p=[0.1, 0.1, 0.8]))
        gross_working_days = int(250 * degree_employment)
        vacation_days = int(30 * degree_employment)
        net_working_days = gross_working_days - vacation_days - sickness_days
        
        base_salary = 2000 + (1500 if education=='Master' else 3000 if education=='PhD' else 800 if education=='Bachelor' else 0)
        salary_brl = round((base_salary + (tenure_months * 20) + (age * 10)) * degree_employment, 2)
        
        increase_last_year = salary_brl * float(np.random.beta(2, 20)) if tenure_months > 12 else 0
        increase_last_5 = salary_brl * float(np.random.beta(5, 10)) if tenure_months > 60 else increase_last_year
        
        parental_leave = 0
        if children_under_18 > 0 and (age_youngest if not np.isnan(age_youngest) else 100) < 2:
            parental_leave = np.random.binomial(1, 0.2)
            
        # External
        unemp_rate = round(np.random.uniform(7, 14), 2)
        vacancies = int(np.random.normal(500, 100))
        short_time_workers = int(np.random.normal(20, 50))
        
        # New Early Variables (Requested by User)
        cargos = ['Analyst', 'Specialist', 'Manager', 'Assistant', 'Director', 'Intern']
        sectors = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations', 'Legal']
        headquarters = ['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Remote']
        
        cargo = np.random.choice(cargos, p=[0.3, 0.3, 0.15, 0.15, 0.05, 0.05])
        sector = np.random.choice(sectors)
        hq = np.random.choice(headquarters, p=[0.4, 0.3, 0.1, 0.1, 0.1])

        # ==========================================
        # 2. MIDDLE VARIETS (Surveys)
        # ==========================================
        
        # Base satisfaction to correlate everything
        true_satisfaction = np.random.normal(7, 1.5)
        true_satisfaction = max(2, min(9, true_satisfaction))
        
        # --- Onboarding ---
        # 3 Days: Integration (5-point)
        # Correlate with tenure (if they stayed long, likely had okay onboarding)
        onb_3d = int(np.random.normal(true_satisfaction/2 + 2.5, 1)) 
        onb_3d = max(1, min(5, onb_3d))
        
        # 15 Days: 1 Q per dim (5-point)
        onb_15d_scores = []
        for _ in range(5): # Cred, Resp, Imp, Pride, Cam
            val = int(np.random.normal(true_satisfaction/2 + 2.5, 1))
            onb_15d_scores.append(max(1, min(5, val)))
        
        # 30 Days: 2 Q per dim (5-point) -> Avg is generated here
        onb_30d_scores = []
        for _ in range(5):
             val = int(np.random.normal(true_satisfaction/2 + 2.5, 1))
             onb_30d_scores.append(max(1, min(5, val)))
             
        # Feature names for Onboarding
        # Grouped for simplicity in generator, but we save them
        
        # --- Climate Survey (55 Qs structure -> Subdimensions) ---
        # Dimensions and Subdimensions
        climate_features = {}
        
        # Helper to generate Likert based on true_satisfaction
        def gen_likert():
            val = int(np.random.normal(true_satisfaction/2 + 2.5, 0.8))
            return max(1, min(5, val))

        # Credibility
        for sub in ['Informative_Comm', 'Accessible_Comm', 'Coordination', 'Supervision', 'Clear_Vision', 'Reliability']:
            climate_features[f'Climate_Cred_{sub}'] = gen_likert()
            
        # Respect
        for sub in ['Prof_Appreciation', 'Indiv_Effort', 'Collaboration', 'Work_Env', 'Personal_Life']:
            climate_features[f'Climate_Resp_{sub}'] = gen_likert()
            
        # Impartiality
        for sub in ['Payment', 'Belonging', 'Impartiality_Recog', 'Treatment', 'Resources']:
            climate_features[f'Climate_Imp_{sub}'] = gen_likert()

        # Pride
        for sub in ['Work', 'Team', 'Company']:
            climate_features[f'Climate_Pride_{sub}'] = gen_likert()
            
        # Camaraderie
        for sub in ['Closeness', 'Relaxation', 'Welcoming', 'Community']:
            climate_features[f'Climate_Cam_{sub}'] = gen_likert()
            
        # eNPS (0-10)
        enps = int(np.random.normal(true_satisfaction, 1.5))
        enps = max(0, min(10, enps))
        
        # c1/c2 (Legacy from Middle)
        c1_sat = int(true_satisfaction)
        c2_ma = round(true_satisfaction + np.random.normal(0, 0.2), 2)

        # ==========================================
        # TARGET & END VARIETS
        # ==========================================
        
        # Turnover Calculation
        score = 0
        score += (5 - onb_3d) * 0.2
        score += (5 - np.mean(onb_30d_scores)) * 0.5
        score += (10 - c1_sat) * 0.8
        score -= (salary_brl / 8000) * 1.5
        score -= (tenure_months / 100) * 0.5
        
        prob_turnover = 1 / (1 + np.exp(-(score - 2)))
        turnover = 1 if np.random.random() < prob_turnover else 0
        
        # End Variets (Only if Turnover = 1)
        exit_reason = "None"
        exit_satisfaction = np.nan
        
        if turnover == 1:
            reasons = ['Better Offer', 'Dissatisfaction', 'Personal', 'Retirement', 'Stress']
            exit_reason = np.random.choice(reasons, p=[0.4, 0.3, 0.1, 0.1, 0.1])
            exit_satisfaction = max(1, min(5, int(np.random.normal(true_satisfaction - 1, 1))))

        # Construct Row
        row = {
            'id': emp_id,
            # Early
            'a1_gender': gender,
            'a2_age': age,
            'a3_number_of_children': num_children,
            'a4_children_under_18_years': children_under_18,
            'a5_age_youngest_children': age_youngest,
            'a6_education_level': education,
            'B2_Public_service_status_ger': public_status,
            'B1_commute_distance_in_km': commute_km,
            'B3_early_retirement_rate': early_retirement_rate,
            'B4_sickness_days': sickness_days,
            'B5_Degree_of_employment': degree_employment,
            'B6_gross_working_days': gross_working_days,
            'B7_Vacation_days': vacation_days,
            'B8_net_working_days': net_working_days,
            'B9_salary_increase_last_year': round(increase_last_year, 2),
            'B10_Tenure_in_month': tenure_months,
            'B11_salary_today_brl': salary_brl,
            'B12_salary_increase_last_5_years': round(increase_last_5, 2),
            'B13_Parental_leave': parental_leave,
            'D1_monthly_unemployment_rate_brazil': unemp_rate,
            'D2_monthly_number_of_vacancies': vacancies,
            'D3_monthly_short_time_workers': short_time_workers,
            
            # New Early Variables
            'B14_Cargo': cargo,
            'B15_Sector': sector,
            'B16_Headquarters': hq,
            
            # Middle
            'c1_overall_employee_satisfaction': c1_sat, # Legacy/Current
            'c2_employee_satisfaction_moving_average': c2_ma,
            'M_Onb_3d_Integration': onb_3d,
            'M_eNPS': enps,
        }
        
        # Add Onboarding 15d
        dims = ['Credibility', 'Respect', 'Impartiality', 'Pride', 'Camaraderie']
        for d, val in zip(dims, onb_15d_scores):
            row[f'M_Onb_15d_{d}'] = val
            
        # Add Onboarding 30d
        for d, val in zip(dims, onb_30d_scores):
            row[f'M_Onb_30d_{d}'] = val
            
        # Add Climate
        row.update(climate_features)
        
        # End
        row['E_Exit_Reason'] = exit_reason
        row['E_Exit_Satisfaction'] = exit_satisfaction
        
        # Target
        row['Turnover'] = turnover
        
        data.append(row)

    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_synthetic_data()
    print(df.head())
    df.to_csv("synthetic_turnover_data.csv", index=False)
    
    # Save a copy to .data
    os.makedirs(".data", exist_ok=True)
    df.to_csv(".data/synthetic_turnover_data.csv", index=False)
    
    print("Lifecycle data generated.")
