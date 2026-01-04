
import os
import sys
import unittest
from shapash.utils.load_smartpredictor import load_smartpredictor

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class TestModelTypes(unittest.TestCase):
    def test_predictor_types(self):
        predictor_path = os.path.join("backend", "ml", "one_year_predictor.pkl")

        if not os.path.exists(predictor_path):
            self.skipTest(f"Predictor not found at {predictor_path}. Train model first.")

        predictor = load_smartpredictor(predictor_path)

        if hasattr(predictor, 'features_types'):
            for col, dtype in predictor.features_types.items():
                self.assertFalse('object' in str(dtype).lower(), f"Column {col} has object type: {dtype}")

if __name__ == '__main__':
    unittest.main()
