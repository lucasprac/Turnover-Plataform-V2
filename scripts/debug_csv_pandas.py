
import pandas as pd
import numpy as np

print("Checking CSV dtypes...")
df = pd.read_csv("synthetic_turnover_data.csv")
for col in df.columns:
    if df[col].dtype == 'object':
        print(f"Column '{col}' is object.")
        # Print first few unique values to see if they are valid strings or garbage
        print(df[col].unique()[:5])
