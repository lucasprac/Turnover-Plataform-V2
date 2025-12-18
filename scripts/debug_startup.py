import sys
import os

print("Start import verification")

# Ensure root is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("Importing matplotlib...")
    import matplotlib
    print("Using Agg...")
    matplotlib.use('Agg')
    
    print("Importing backend.api...")
    import backend.api
    print("Import success!")
except Exception as e:
    print(f"Import failed: {e}")
