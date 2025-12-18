
import data_generator
import numpy as np
import pandas as pd

print("Generating 10 rows...")
df = data_generator.generate_synthetic_data(n_employees=10)

print("Checking for non-scalar types...")
for i in range(len(df)):
    row = df.iloc[i]
    for col in df.columns:
        val = row[col]
        # Check if it's a numpy array or list
        if isinstance(val, (np.ndarray, list)):
            print(f"!!! Column '{col}' row {i} is type {type(val)}: {val}")
        
        # Check if it's a string that looks like a list
        if isinstance(val, str) and val.startswith('[') and val.endswith(']'):
             print(f"!!! Column '{col}' row {i} is stringified list: {val}")
             
print("Check complete.")
