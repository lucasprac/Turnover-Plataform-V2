import os
import sys

# Simulate the sys.path setup from api.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import one_year_model
import five_year_model

print(f"One Year Model File: {one_year_model.__file__}")
print(f"One Year Model Path Variable: {one_year_model.MODEL_PATH}")
print(f"Exists? {os.path.exists(one_year_model.MODEL_PATH)}")

print(f"Five Year Model File: {five_year_model.__file__}")
print(f"Five Year Model Path Variable: {five_year_model.MODEL_PATH}")
print(f"Exists? {os.path.exists(five_year_model.MODEL_PATH)}")

try:
    one_year_model.load_one_year_model()
    print("One Year Model Loaded Successfully")
except Exception as e:
    print(f"One Year Model Load Failed: {e}")

try:
    five_year_model.load_five_year_model()
    print("Five Year Model Loaded Successfully")
except Exception as e:
    print(f"Five Year Model Load Failed: {e}")
