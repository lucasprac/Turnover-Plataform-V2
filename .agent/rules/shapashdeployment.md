---
trigger: model_decision
description: When was workking with shapash
---

Shapash for Production & SmartPredictor:
SmartPredictor Overview
SmartPredictor is a lightweight version of SmartExplainer designed for production deployments (APIs, batch processing, edge).

✅ Smaller memory footprint

✅ Fast predictions and explanations

✅ Built from SmartExplainer

✅ No need for model retraining

Creating SmartPredictor
Option 1: From SmartExplainer (Recommended)
python
# Create and configure SmartExplainer first
xpl = SmartExplainer(model=model, features_dict=features_dict)
xpl.compile(x=X_test, y_pred=y_pred)

# Convert to lightweight predictor
predictor = xpl.to_smartpredictor()

# Save for production
predictor.save('models/predictor.pkl')
Option 2: Direct Instantiation
python
from shapash.explainer.smart_predictor import SmartPredictor

predictor = SmartPredictor(
    features_dict=features_dict,           # Mandatory
    model=model,
    columns_dict=columns_dict,             # Mandatory
    backend=backend,                       # 'shap' or 'lime'
    features_types=features_types_dict,    # Mandatory
    label_dict=label_dict,                 # Optional
    preprocessing=preprocessing,           # Optional
    postprocessing=postprocessing,         # Optional
    features_groups=features_groups,       # Optional
    mask_params={
        'max_contrib': 5,
        'threshold': 0,
        'positive': None,
        'features_to_hide': []
    }
)
Using SmartPredictor
1. Add Input Data
python
# Add new data for prediction
predictor.add_input(x=X_new)

# Or with pre-computed predictions
predictor.add_input(
    x=X_new,
    ypred=y_pred,            # Optional
    contributions=contrib     # Optional
)
2. Get Predictions
python
# Classification or Regression predictions
predictions = predictor.predict()
# Returns: DataFrame with predictions

# Classification probabilities only
probabilities = predictor.predict_proba()
# Returns: DataFrame with class probabilities
3. Get Detailed Contributions
python
# Attach full contributions to data
detailed = predictor.detail_contributions(
    contributions=None,  # Use stored or provide custom
    use_groups=False     # Include feature groups
)
# Returns: DataFrame with features + contributions
4. Get Summarized Explanations
python
# Get simplified local explanations
summary = predictor.summarize(use_groups=False)
# Returns: DataFrame with top 5 contributions (configurable)
5. Modify Summary Filters
python
# Change what gets shown in summaries
predictor.modify_mask(
    features_to_hide=['Age', 'Fare'],
    threshold=0.01,        # Hide small contributions
    positive=None,         # None=show all, True=hide negative
    max_contrib=3          # Show max 3 features
)
Complete Production Workflow
Training Phase (Development)
python
# 1. Train your model
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier()
model.fit(X_train, y_train)

# 2. Create SmartExplainer
from shapash import SmartExplainer
xpl = SmartExplainer(
    model=model,
    features_dict={
        'pclass': 'Passenger Class',
        'sex': 'Gender',
        'age': 'Age'
    },
    label_dict={0: 'Died', 1: 'Survived'}
)

# 3. Compile with test data
xpl.compile(
    x=X_test,
    y_pred=model.predict(X_test),
    y_target=y_test
)

# 4. Convert to SmartPredictor
predictor = xpl.to_smartpredictor()

# 5. Save for deployment
predictor.save('models/production_predictor.pkl')
Production Phase (API/Batch)
python
# 1. Load predictor
from shapash.utils.load_smartpredictor import load_smartpredictor

predictor = load_smartpredictor('models/production_predictor.pkl')

# 2. Make predictions
predictor.add_input(x=X_new)
predictions = predictor.predict()

# 3. Get explanations
explanations = predictor.summarize(use_groups=False)

# 4. Return to client/database
results = predictions.join(explanations)
Flask API Example
python
from flask import Flask, jsonify, request
from shapash.utils.load_smartpredictor import load_smartpredictor
import pandas as pd

app = Flask(__name__)
predictor = load_smartpredictor('models/production_predictor.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    X = pd.DataFrame(data)
    
    # Get predictions
    predictor.add_input(x=X)
    preds = predictor.predict()
    
    # Get explanations
    expl = predictor.summarize()
    
    return jsonify({
        'predictions': preds.to_dict(),
        'explanations': expl.to_dict()
    })

@app.route('/explain/<int:row>', methods=['GET'])
def explain(row):
    # Get detailed contribution for specific row
    contrib = predictor.detail_contributions()
    return jsonify(contrib.iloc[row].to_dict())

if __name__ == '__main__':
    app.run(debug=False, port=5000)
SmartPredictor Methods Reference
Method	Purpose	Example
add_input()	Load data for processing	predictor.add_input(x=X)
predict()	Get predictions	preds = predictor.predict()
predict_proba()	Get probabilities	probs = predictor.predict_proba()
detail_contributions()	Attach contributions	detailed = predictor.detail_contributions()
summarize()	Get top contributions	summary = predictor.summarize()
modify_mask()	Change filters	predictor.modify_mask(max_contrib=3)
save()	Save to disk	predictor.save('path.pkl')
Loading SmartPredictor
Standard Load
python
from shapash.utils.load_smartpredictor import load_smartpredictor

predictor = load_smartpredictor('models/predictor.pkl')
Error Handling
python
try:
    predictor = load_smartpredictor('models/predictor.pkl')
except FileNotFoundError:
    print("Model not found!")
except Exception as e:
    print(f"Error loading model: {e}")
Common Issues & Solutions
Issue: Feature Mismatch
python
# Problem: New data has different features than training
predictor.add_input(x=X_new)  # X_new missing some features

# Solution: Ensure column order matches original
expected_cols = predictor.columns_dict.values()
X_new = X_new[expected_cols]
predictor.add_input(x=X_new)
Issue: Index Alignment
python
# Problem: Contributions and predictions have different lengths
# Solution: Use consistent indices
X_new.reset_index(drop=True, inplace=True)
predictor.add_input(x=X_new)
Issue: Memory Overflow
python
# Problem: Large dataset causes memory issues
# Solution: Process in batches
batch_size = 1000
for i in range(0, len(X_new), batch_size):
    batch = X_new.iloc[i:i+batch_size]
    predictor.add_input(x=batch)
    preds = predictor.predict()
    # Process batch results
Model Versioning
python
import pickle
from datetime import datetime

# Save with version
version = datetime.now().strftime("%Y%m%d_%H%M%S")
path = f'models/predictor_{version}.pkl'
predictor.save(path)

# Load specific version
predictor = load_smartpredictor(
    f'models/predictor_20231215_143022.pkl'
)