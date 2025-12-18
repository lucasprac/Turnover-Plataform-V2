
import pandas as pd
import numpy as np
import csv

print("Inspecting synthetic_turnover_data.csv raw content...")

found = False
with open("synthetic_turnover_data.csv", "r", newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    for i, row in enumerate(reader):
        for j, val in enumerate(row):
            if "[" in val and "]" in val:
                # Potential list string
                print(f"Row {i}, Column '{header[j]}': {val}")
                found = True
                if i > 5: break # Don't spam
        if found and i > 5: break

if not found:
    print("No obvious list definitions '[...]' found in data.")
else:
    print("Found list-like strings. This causes the ValueError.")
