---
trigger: model_decision
description: When was working with the shap
---

# SHAP Decision Plots

SHAP decision plots visualize how complex models make predictions by showing the cumulative effect of features. This is particularly useful for understanding individual predictions and comparing model behaviors.

## Installation and Setup

The `shap` library is required. You can install it via pip: `pip install shap`.
The examples primarily use `lightgbm`, `matplotlib`, `numpy`, `pickle`, and `sklearn`.

```python
import lightgbm as lgb
import matplotlib.pyplot as plt
import numpy as np
import pickle
import shap
from sklearn.model_selection import train_test_split, StratifiedKFold
import warnings

# Example: Load dataset and train a LightGBM model
X, y = shap.datasets.adult()
X_display, y_display = shap.datasets.adult(display=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7)
d_train = lgb.Dataset(X_train, label=y_train)
d_test = lgb.Dataset(X_test, label=y_test)

params = {
    "max_bin": 512, "learning_rate": 0.05, "boosting_type": "gbdt", "objective": "binary",
    "metric": "binary_logloss", "num_leaves": 10, "verbose": -1, "min_data": 100,
    "boost_from_average": True, "random_state": 7
}
model = lgb.train(params, d_train, 10000, valid_sets=[d_test], early_stopping_rounds=50, verbose_eval=1000)

# Calculate SHAP values
explainer = shap.TreeExplainer(model)
expected_value = explainer.expected_value
if isinstance(expected_value, list):
    expected_value = expected_value[1] # For multi-output, select a specific output
select = range(20) # Select a subset of observations
features = X_test.iloc[select]
features_display = X_display.loc[features.index]

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    shap_values = explainer.shap_values(features)[1] # For binary, select class 1
    shap_interaction_values = explainer.shap_interaction_values(features)
if isinstance(shap_interaction_values, list):
    shap_interaction_values = shap_interaction_values[1]
```

## `shap.decision_plot` Function

The `shap.decision_plot` function is the core of creating decision plots.

```python
shap.decision_plot(
    base_value,             # The base value (e.g., explainer.expected_value). All SHAP values are relative to this.
    shap_values,            # A matrix of SHAP values (e.g., explainer.shap_values(X_test)).
    feature_names=None,     # Feature names (e.g., X_test).
    highlight=None,         # Indices of observations to highlight (dotted lines). Can be a single index or a list/array.
    link='identity',        # Transformation function for the output (e.g., 'logit' for log odds to probabilities).
    feature_order='importance', # Ordering of features on the y-axis: 'importance' (default), 'hclust', or user-defined list.
    feature_display_range=None, # A slice or range object to control which ordered features are displayed.
    new_base_value=None,    # An arbitrary new base value to shift the plot's origin without changing predictions.
    show=True,              # Whether to display the plot immediately.
    return_objects=False,   # Whether to return plot structures (e.g., feature_idx, xlim) for consistent plotting.
    # Other matplotlib-related arguments: xlim, yaxis_label, title, alpha, color, etc.
)
```

## Key Features and Usage Patterns

### Basic Decision Plot

-   **X-axis**: Model's output (e.g., log odds or probabilities).
-   **Y-axis**: Features, ordered by importance (default) or other methods.
-   **Lines**: Each colored line represents an observation's prediction path, starting from `base_value` and cumulatively adding SHAP values for each feature.
-   **`link='logit'`**: Transforms log odds to probabilities for better interpretability.

```python
# Basic plot
shap.decision_plot(expected_value, shap_values, features_display)

# Plot with logit link for probabilities
shap.decision_plot(expected_value, shap_values, features_display, link='logit')
```

### Highlighting Observations

Highlight specific observations to inspect their prediction paths, especially useful for misclassified instances.

```python
# Highlight misclassified observations
y_pred = (shap_values.sum(1) + expected_value) > 0 # Naive cutoff at 0 log odds
misclassified = y_pred != y_test[select]
shap.decision_plot(expected_value, shap_values, features_display, link='logit', highlight=misclassified)

# Plot a single highlighted observation
shap.decision_plot(expected_value, shap_values[misclassified], features_display[misclassified],
                   link='logit', highlight=0) # highlight=0 refers to the first observation in the subset
```

### Multioutput Predictions

Visualize predictions from multioutput models (e.g., multi-class classification) using `shap.multioutput_decision_plot`.

```python
# Assuming heart_base_values, heart_shap_values, heart_predictions, heart_feature_names are loaded
# Define a helper function for legend labels
def class_labels(row_index):
    return [f'Class {i + 1} ({heart_predictions[row_index, i].round(2):.2f})' for i in range(class_count)]

row_index = 2
shap.multioutput_decision_plot(heart_base_values, heart_shap_values,
                               row_index=row_index,
                               feature_names=heart_feature_names,
                               highlight=[np.argmax(heart_predictions[row_index])], # Highlight predicted class
                               legend_labels=class_labels(row_index),
                               legend_location='lower right')
```

### Displaying Interaction Effects

Decision plots can incorporate SHAP interaction values, showing the combined effect of main and interaction terms.

```python
# Plot with SHAP interaction values
shap.decision_plot(expected_value, shap_interaction_values[misclassified], features_display[misclassified],
                   link='logit')
```

### Exploring Feature Effects for a Range of Values

Generate hypothetical observations by varying a feature's value and plot their SHAP paths to understand model sensitivity.

```python
idx = 25 # Reference observation index
rg = range(0, 10100, 100) # Range for 'Capital Gain'
R = X.iloc[np.repeat(idx, len(rg))].reset_index(drop=True)
R['Capital Gain'] = rg

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    hypothetical_shap_values = explainer.shap_values(R)[1]

# Plotting the hypothetical scenarios
# feature_idx is a manually determined order for consistency across plots
feature_idx = [8, 5, 0, 2, 4, 3, 7, 10, 6, 11, 9, 1]
shap.decision_plot(expected_value, hypothetical_shap_values[0], X_display.iloc[idx], feature_order=feature_idx,
                   link='logit')

# Plot all hypothetical observations with 'hclust' ordering
shap.decision_plot(expected_value, hypothetical_shap_values, R, link='logit', feature_order='hclust', highlight=0)
```

### Identifying Outliers and Typical Paths

-   Use `feature_order='hclust'` to group similar prediction paths, making outliers or common patterns stand out.
-   Avoid `link='logit'` when plotting outliers, as the sigmoid function can distort amplitudes.

```python
# Identify outliers
y_pred = model.predict(X_test)
T = X_test[(y_pred >= 0.03) & (y_pred <= 0.1)] # Filter predictions in a specific range
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    sh = explainer.shap_values(T)[1]
r = shap.decision_plot(expected_value, sh, T, feature_order='hclust', return_objects=True)

# Identify typical prediction paths
T_high_pred = X_test[y_pred >= 0.98]
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    sh_high_pred = explainer.shap_values(T_high_pred)[1]
shap.decision_plot(expected_value, sh_high_pred, T_high_pred, feature_order='hclust', link='logit')
```

### Comparing Multiple Models

Use `shap.multioutput_decision_plot` to compare predictions from different models or an ensemble.

```python
# Assuming ensemble_base_values, ensemble_shap_values, ensemble_predictions are assembled
labels = [f'Model {i + 1} ({ensemble_predictions[i].round(2):.2f})' for i in range(model_count)]
shap.multioutput_decision_plot(ensemble_base_values, ensemble_shap_values, 0, feature_names=X.columns.to_list(),
                               link='logit', legend_labels=labels, legend_location='lower right')
```

## Preserving Order and Scale Between Plots

To make multiple plots directly comparable, use `return_objects=True` to retrieve `feature_idx` and `xlim` from a reference plot and apply them to subsequent plots.

```python
# Create the first plot and return its structures
r = shap.decision_plot(expected_value, shap_values, features_display, return_objects=True)

# Create another plot using the same feature order and x-axis extents
idx = 9
shap.decision_plot(expected_value, shap_values[idx], features_display.iloc[idx],
                   feature_order=r.feature_idx, xlim=r.xlim)
```

## Selecting Features for Display

The `feature_order` and `feature_display_range` parameters control which features are shown and their order.

-   **`feature_order`**:
    -   `'importance'` (default): Orders by descending importance (over the plotted observations).
    -   `'hclust'`: Orders by hierarchical clustering to group similar prediction paths.
    -   `list`: A user-defined list of feature names or indices.
-   **`feature_display_range`**:
    -   A `slice` or `range` object (e.g., `slice(None, -21, -1)` for the top 20, `range(0, 11, 1)` for the first 10 ascending).
    -   `slice(None, None, -1)` displays all features in descending order.

```python
# Show the first 10 interaction features in descending hclust order
shap.decision_plot(expected_value, shap_interaction_values, features, link='logit',
                   feature_order='hclust', feature_display_range=range(10, -1, -1))

# Show the last 10 interaction features in descending hclust order
shap.decision_plot(expected_value, shap_interaction_values, features, link='logit',
                   feature_order='hclust', feature_display_range=slice(None, -11, -1))

# Display all features
shap.decision_plot(expected_value, shap_interaction_values, features, link='logit',
                   feature_order='hclust', feature_display_range=slice(None, None, -1))
```

## Changing the SHAP Base Value

The `new_base_value` argument allows shifting the plot's starting point (the base value) without altering the final predicted values. This can make plots more visually intuitive, for example, by centering on a classification cutoff point.

```python
# Change the base value to probability 0.4 (converted to log odds)
p = 0.4
new_base_value = np.log(p / (1 - p)) # Logit function
shap.decision_plot(expected_value, shap_values, features_display, link='logit', new_base_value=new_base_value)
```