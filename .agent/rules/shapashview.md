---
trigger: model_decision
description: when you use it shapash, be guide by this document
---

Shapash for Plotting & Visualization:
All plotting is accessed via xpl.plot.* where xpl is your SmartExplainer instance.

1. Features Importance (Global)
python
xpl.plot.features_importance(
    mode='global',           # 'global', 'global-local', or 'cumulative'
    max_features=20,         # Limit displayed features
    page='top',              # 'top', 'worst', or page number
    selection=None,          # Subset indices to filter
    label=-1,                # Class label for classification (-1 = all)
    group_name=None,         # Show specific feature group only
    display_groups=True,     # Display feature groups
    force=False,             # Force recompute
    width=900,               # Figure width
    height=500,              # Figure height
    file_name='importance.html',  # Save to HTML file
    auto_open=False,         # Auto-open in browser
    zoom=False,              # Enable zoom
    normalize_by_nb_samples=False,  # Normalize by sample count
    degree='slider'          # 'slider' for interactive mode
)
Use Cases:

Understand which features matter most overall

Compare feature importance across classes

Identify least important features to remove

Modes:

'global': Average importance across all samples

'global-local': Both global and per-sample importance

'cumulative': Cumulative importance (shows how many features needed)

2. Local Explanation (Single Instance)
python
xpl.plot.local_plot(
    index=None,              # Select by DataFrame index value
    row_num=None,            # Or select by row number (0-based)
    query=None,              # Or select by condition (e.g., 'Age > 30')
    label=None,              # Class label (classification)
    show_masked=False,       # Show sum of hidden contributions
    show_predict=True,       # Display prediction value
    display_groups=None,     # Use feature groups
    yaxis_max_label=12,      # Max labels to show on axis
    width=900,
    height=550,
    file_name='local_plot.html',
    auto_open=False
)
Use Cases:

Understand why model made a specific prediction

Explain individual decisions to stakeholders

Debug model behavior on specific instances

Selection Methods:

python
# By index value
xpl.plot.local_plot(index=5)

# By row number (0-based)
xpl.plot.local_plot(row_num=0)

# By condition
xpl.plot.local_plot(query='Pclass == 1 and Age > 30')
3. Feature Contribution Distribution
python
xpl.plot.contribution_plot(
    col,                     # Feature name, label, or column index
    selection=None,          # Subset of instances
    label=-1,                # Class label (classification)
    violin_maxf=10,          # Switch to scatter if > N categories
    max_points=2000,         # Limit points for performance
    proba=True,              # Color by probability (classification)
    width=900,
    height=600,
    file_name='contribution.html',
    auto_open=False,
    zoom=False
)
Use Cases:

See how a feature impacts predictions across instances

Identify outliers and unusual patterns

Compare distributions by class (classification)

Visualization Type:

Automatically selects violin plot for continuous features

Automatically selects scatter plot for categorical features

Choice depends on: feature type, number of categories, task type

python
# Examples
xpl.plot.contribution_plot('Age')
xpl.plot.contribution_plot('Sex', label=1)  # Class 1 only
xpl.plot.contribution_plot(col=0, selection=[0, 10, 20])  # First 3 rows
4. Compare Multiple Instances
python
xpl.plot.compare_plot(
    index=None,              # Select by index values
    row_num=None,            # Or select by row numbers
    label=None,              # Class label (classification)
    max_features=20,         # Max features to show
    show_predict=True,       # Show prediction values
    width=900,
    height=550,
    file_name='compare.html',
    auto_open=True
)
Use Cases:

Compare explanations across multiple predictions

See what makes instances different

Validate model consistency

python
# Compare rows 0, 1, and 2
xpl.plot.compare_plot(row_num=[0, 1, 2])

# Compare by index values
xpl.plot.compare_plot(index=[10, 25, 50])

# Compare class 1 predictions only
xpl.plot.compare_plot(row_num=[0, 5, 10], label=1)
5. Feature Compacity (Subset Analysis)
python
xpl.plot.compacity_plot(
    selection=None,          # Subset of instances
    approx=0.9,              # Target accuracy (90% = 0.9)
    nb_features=5,           # Number of top features to test
    max_points=2000,         # Limit points
    force=False,             # Force recompute
    width=900,
    height=600,
    file_name='compacity.html',
    auto_open=False
)
Use Cases:

Find minimal set of features for predictions

Check if top 5 features capture 90% of model behavior

Simplify model explanations

Output Shows:

How many features needed to reach target accuracy

Gap between subset predictions and full model

Feature importance ranking

python
# Find features needed for 85% accuracy
xpl.plot.compacity_plot(approx=0.85, nb_features=10)
6. Local Neighbors (Consistency Check)
python
xpl.plot.local_neighbors_plot(
    index=None,              # Select instance
    row_num=None,            # Or by row number
    max_features=10,         # Max features to show
    file_name='neighbors.html',
    height='auto',
    width=900
)
Use Cases:

Verify model is consistent for similar instances

Find nearest neighbors to a prediction

Detect noisy or unusual instances

7. Stability Analysis
python
xpl.plot.stability_plot(
    selection=None,          # Subset of instances
    max_points=500,          # Limit points
    max_features=10,         # Max features
    distribution='none',     # 'none', 'boxplot', or 'violin'
    force=False,             # Force recompute
    file_name='stability.html'
)
Use Cases:

Check if feature contributions vary across similar instances

Detect instability in model behavior

Validate explanation robustness

8. Feature Interactions
python
xpl.plot.top_interactions_plot(
    nb_top_interactions=5,   # Number of interactions to show
    selection=None,          # Subset of instances
    max_points=500,          # Limit points
    violin_maxf=10,          # Category threshold
    width=900,
    height=600,
    file_name='interactions.html'
)
Use Cases:

Discover which feature pairs interact

Understand non-linear relationships

Find important feature combinations

Common Plotting Patterns
Classification Analysis
python
# Global importance by class
xpl.plot.features_importance(mode='global', label=1)

# Show all local explanations
xpl.plot.local_plot(row_num=0)
xpl.plot.local_plot(row_num=1)

# Check contribution distribution
xpl.plot.contribution_plot('Age', label=1, proba=True)

# Compare predictions
xpl.plot.compare_plot(row_num=[0, 5, 10], label=1)
Regression Analysis
python
# Cumulative importance
xpl.plot.features_importance(mode='cumulative')

# Single feature analysis
xpl.plot.contribution_plot('feature_name')

# Check feature compacity
xpl.plot.compacity_plot(approx=0.85, nb_features=10)
Model Validation
python
# Check consistency across neighbors
xpl.plot.local_neighbors_plot(row_num=0)

# Analyze stability
xpl.plot.stability_plot(selection=[0, 1, 2, 3, 4])

# Find interactions
xpl.plot.top_interactions_plot(nb_top_interactions=3)
Saving & Exporting Plots
All plotting methods accept:

python
file_name='plot_name.html'   # Save to HTML file
auto_open=False              # Don't auto-open browser
Example:

python
xpl.plot.features_importance(
    file_name='output/importance.html',
    auto_open=True  # Open in browser after saving
)