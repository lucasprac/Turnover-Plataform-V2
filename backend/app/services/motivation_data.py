import pandas as pd
import numpy as np
from typing import List, Dict

def generate_mock_motivation_data(num_samples: int = 500) -> pd.DataFrame:
    """
    Generates a synthetic dataset with SDT Motivation dimensions and Turnover.
    """
    np.random.seed(42)
    
    # IDs
    ids = [f"EMP_{i:04d}" for i in range(num_samples)]
    
    # 1. Generate Question Answers (1-5 Scale)
    # We'll simulate correlations: 
    # High Intrinsic/Identified -> Low Turnover
    # High Amotivation -> High Turnover
    
    data = {"id": ids}
    
    # True latent state of motivation (0-1)
    # Higher = More self-determined
    latent_motivation = np.random.beta(2, 2, num_samples)
    
    # Construct mappings (Question Indices 1-19)
    # Amotivation: 1-3 (Negatively correlated with latent)
    for i in range(1, 4):
        # Base: 5 - 4*latent + noise
        base = 5 - 4 * latent_motivation + np.random.normal(0, 0.5, num_samples)
        data[f"Q{i}"] = np.clip(np.round(base), 1, 5).astype(int)

    # Extrinsic Social: 4-6 (Weakly negative/low correlation)
    for i in range(4, 7):
        base = 3 + np.random.normal(0, 1, num_samples)
        data[f"Q{i}"] = np.clip(np.round(base), 1, 5).astype(int)

    # Extrinsic Material: 7-9 (Moderate)
    for i in range(7, 10):
        base = 3 + np.random.normal(0, 1, num_samples)
        data[f"Q{i}"] = np.clip(np.round(base), 1, 5).astype(int)

    # Introjected: 10-13 (Mixed)
    for i in range(10, 14):
        base = 2 + 2 * latent_motivation + np.random.normal(0, 0.8, num_samples)
        data[f"Q{i}"] = np.clip(np.round(base), 1, 5).astype(int)

    # Identified: 14-16 (Positive)
    for i in range(14, 17):
        base = 1 + 3.5 * latent_motivation + np.random.normal(0, 0.6, num_samples)
        data[f"Q{i}"] = np.clip(np.round(base), 1, 5).astype(int)

    # Intrinsic: 17-19 (Strongly Positive)
    for i in range(17, 20):
        base = 1 + 3.8 * latent_motivation + np.random.normal(0, 0.5, num_samples)
        data[f"Q{i}"] = np.clip(np.round(base), 1, 5).astype(int)

    # 2. Calculate Dimensions
    df = pd.DataFrame(data)
    
    df['Amotivation'] = df[['Q1', 'Q2', 'Q3']].mean(axis=1)
    df['Ext_Social'] = df[['Q4', 'Q5', 'Q6']].mean(axis=1)
    df['Ext_Material'] = df[['Q7', 'Q8', 'Q9']].mean(axis=1)
    df['Introjected'] = df[['Q10', 'Q11', 'Q12', 'Q13']].mean(axis=1)
    df['Identified'] = df[['Q14', 'Q15', 'Q16']].mean(axis=1)
    df['Intrinsic'] = df[['Q17', 'Q18', 'Q19']].mean(axis=1)

    # 3. Generate Turnover (Target)
    # Prob increases with Amotivation, decreases with Intrinsic
    # Sigmoid
    logit = -3 + 0.8 * df['Amotivation'] - 0.6 * df['Intrinsic'] - 0.4 * df['Identified'] + 0.2 * df['Ext_Social']
    prob = 1 / (1 + np.exp(-logit))
    df['Turnover'] = (np.random.random(num_samples) < prob).astype(int)
    
    return df

if __name__ == "__main__":
    df = generate_mock_motivation_data()
    print(df.head())
    print(df['Turnover'].value_counts())
    df.to_csv("mock_sdt_data.csv", index=False)
