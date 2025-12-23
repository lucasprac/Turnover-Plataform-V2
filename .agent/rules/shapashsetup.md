---
trigger: model_decision
description: When working with shapash
---

Shapash Core Concepts & Setup:
Overview
Shapash is a Python library for making machine learning models interpretable and understandable.

Main Components
SmartExplainer: Main object for model analysis during development

SmartPredictor: Lightweight object for production predictions

SmartPlotter: Visualization and plotting methods

Data Loader: Pre-built sample datasets

Installation
python
pip install shapash
Quick Start: SmartExplainer
Initialize
python
from shapash import SmartExplainer
from shapash.data.data_loader import data_loading

# Load sample data
titanic_df, features_dict = data_loading('titanic')

# Your trained model
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Create SmartExplainer
xpl = SmartExplainer(
    model=model,
    features_dict=features_dict,
    label_dict={0: 'Death', 1: 'Survival'},
    backend='shap'  # or 'lime'
)
Compile with Data
python
# Prepare with test data
xpl.compile(
    x=X_test,
    y_pred=y_pred,  # Optional
    y_target=y_test,  # Optional
)
SmartExplainer Constructor Parameters
Parameter	Type	Purpose
model	model object	Trained ML model (needs predict() method)
backend	str	'shap' (default) or 'lime' for explanations
preprocessing	encoder/ColumnTransformer	Reverse-transform encoded features
postprocessing	dict	Format features (prefix, suffix, case, etc.)
features_groups	dict	Group related features together
features_dict	dict	Technical → business-friendly names
label_dict	dict	Class index → label name (classification)
title_story	str	Title for reports and webapp
palette_name	str	Color palette for visualizations
colors_dict	dict	Custom color definitions
SmartExplainer.compile() Parameters
Parameter	Type	Purpose
x	DataFrame	Raw dataset (as end-users see it)
contributions	DataFrame/ndarray	Pre-computed SHAP or importance values
y_pred	Series	Model predictions (for coloring)
proba_values	Series	Prediction probabilities (classification)
y_target	Series	True labels for accuracy metrics
additional_data	DataFrame	Extra features outside the model
additional_features_dict	dict	Names for additional features
SmartExplainer Key Attributes
After compilation, access:

python
# Data containers
xpl.data['contrib_sorted']      # Top contributions per instance
xpl.data['var_dict']            # Feature column indices
xpl.data['x_sorted']            # Features values (sorted by contribution)

# Processed datasets
xpl.x_encoded                   # Preprocessed (what model sees)
xpl.x_init                      # Inverse-transformed with postprocessing
xpl.x_contrib_plot              # Inverse-transformed (no postprocessing)

# Predictions & explanations
xpl.y_pred                      # Predictions
xpl.contributions               # Aggregated contributions
xpl.features_imp                # Feature importance (global)

# Mappings
xpl.features_dict               # technical_name → business_name
xpl.inv_features_dict           # business_name → technical_name
xpl.label_dict                  # label_index → label_name
xpl.inv_label_dict              # label_name → label_index
xpl.columns_dict                # column_index → technical_name

# Analysis data
xpl.local_neighbors             # Neighbor consistency data
xpl.features_stability          # Feature stability metrics
Common Setup Patterns
Classification Model
python
from shapash import SmartExplainer

xpl = SmartExplainer(
    model=clf_model,
    label_dict={0: 'Negative', 1: 'Positive'},
    features_dict=feature_mapping
)

xpl.compile(
    x=X_test,
    y_pred=y_pred,
    proba_values=y_proba,  # Include probabilities
    y_target=y_test
)
Regression Model
python
xpl = SmartExplainer(
    model=reg_model,
    features_dict=feature_mapping
)

xpl.compile(
    x=X_test,
    y_pred=y_pred,
    y_target=y_test
)
With Preprocessing
python
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

preprocessor = ColumnTransformer([
    ('scale', StandardScaler(), numeric_cols),
    ('encode', OneHotEncoder(), categorical_cols)
])

xpl = SmartExplainer(
    model=model,
    preprocessing=preprocessor,
    features_dict=features_dict
)

xpl.compile(x=X_test)
Filtering Explainability
python
# Configure what gets shown
xpl.filter(
    features_to_hide=['Age', 'Fare'],    # Hide specific features
    threshold=0.05,                       # Hide small contributions
    positive=True,                        # Hide negative contributions
    max_contrib=5,                        # Max features per explanation
    display_groups=True                   # Show feature groups
)

# Export as pandas DataFrame
summary_df = xpl.to_pandas(
    features_to_hide=['Age'],
    threshold=0.01,
    max_contrib=3,
    proba=True,  # Include probabilities (classification)
    use_groups=True
)
Save & Load
python
# Save explainer to disk
xpl.save('explainer.pkl')

# Load from disk (later)
from shapash import SmartExplainer
xpl_loaded = SmartExplainer.load('explainer.pkl')