
import pandas as pd
import re

try:
    df = pd.read_csv('synthetic_turnover_data.csv')
    print("CSV Loaded. Shape:", df.shape)
    
    found_issues = False
    for col in df.columns:
        if df[col].dtype == 'object':
            # Check for generic bracket patterns
            mask = df[col].astype(str).str.contains(r'[\[\]]')
            if mask.any():
                found_issues = True
                print(f"Values with brackets found in column '{col}':")
                print(df[col][mask].unique()[:5])
                
                # Check previous regex failure
                strict_regex = r'^\[.*\]$'
                strict_mask = df[col].astype(str).str.contains(strict_regex, regex=True)
                missed = mask & (~strict_mask)
                if missed.any():
                    print("  !!! These would be missed by strict regex:")
                    print(df[col][missed].unique()[:5])
                    
except Exception as e:
    print(f"Error inspecting CSV: {e}")
