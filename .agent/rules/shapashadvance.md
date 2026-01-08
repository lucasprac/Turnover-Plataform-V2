---
trigger: model_decision
description: when you use it shapash, be guide by this document
---

Shapash Advanced Topics & Reports:
Postprocessing Features
Format feature values for business-friendly display.

python
postprocessing = {
    'Age': {
        'type': 'prefix',
        'rule': 'Age: '
    },
    'Fare': {
        'type': 'suffix',
        'rule': ' USD'
    },
    'Embarked': {
        'type': 'transcoding',
        'rule': {
            'C': 'Cherbourg',
            'S': 'Southampton',
            'Q': 'Queenstown'
        }
    },
    'Pclass': {
        'type': 'case',
        'rule': 'lower'
    },
    'Sex': {
        'type': 'regex',
        'rule': {'in': '_', 'out': ' '}
    }
}

xpl = SmartExplainer(
    model=model,
    postprocessing=postprocessing
)
Postprocessing Types
Type	Purpose	Example
prefix	Add text before value	'Age: 25'
suffix	Add text after value	'1500 USD'
transcoding	Replace value with text	'S' → 'Southampton'
case	Change text case	'lower', 'upper'
regex	Pattern replacement	{'in': '_', 'out': ' '}
Feature Groups
Organize related features together for easier analysis.

python
features_groups = {
    'Demographics': ['Age', 'Sex', 'SibSp', 'Parch'],
    'Travel': ['Pclass', 'Embarked'],
    'Financial': ['Fare']
}

xpl = SmartExplainer(
    model=model,
    features_groups=features_groups
)

# Use in plotting
xpl.plot.features_importance(
    group_name='Demographics',
    display_groups=True
)

# Use in summaries
xpl.to_pandas(use_groups=True)
Generate HTML Report
Create comprehensive analysis report.

python
xpl.generate_report(
    output_file='reports/analysis.html',
    project_info_file='project_info.yml',
    x_train=X_train,
    y_train=y_train,
    y_test=y_test,
    title_story='Titanic Survival Model',
    title_description='Explainability analysis and performance metrics',
    metrics=[
        {
            'path': 'sklearn.metrics.accuracy_score',
            'name': 'Accuracy'
        },
        {
            'path': 'sklearn.metrics.f1_score',
            'name': 'F1 Score'
        },
        {
            'path': 'sklearn.metrics.roc_auc_score',
            'name': 'ROC-AUC',
            'use_proba_values': True
        }
    ],
    working_dir='/tmp/shapash_work',
    notebook_path='report_notebook.ipynb',
    kernel_name='python3',
    max_points=200,
    display_interaction_plot=False,
    nb_top_interactions=5
)
Project Info YAML
Create project_info.yml:

text
project_name: Titanic Survival Prediction
project_description: ML model explaining passenger survival factors
model_name: Random Forest Classifier
model_type: Classification
author: Data Science Team
date: 2024-01-15
version: 1.0
Report Contents
Global feature importance

Model performance metrics

Sample predictions with explanations

Feature contribution analysis

Interaction analysis (if enabled)

Distribution comparisons

Interactive Web App
Launch interactive dashboard.

python
# Start webapp (runs in background)
app_thread = xpl.run_app(
    port=8050,
    host='0.0.0.0',
    title_story='Model Explorer Dashboard',
    settings={
        'rows': 100,        # Rows to load
        'points': 2000,     # Max scatter points
        'violin': 10,       # Category threshold
        'features': 20      # Max features shown
    }
)

# Use in Jupyter
# App opens at: http://localhost:8050

# Stop the app when done
app_thread.kill()
Webapp Features
✅ Interactive feature importance

✅ Instance-level explanations

✅ Feature distributions

✅ Prediction explorer

✅ Neighborhood analysis

✅ Custom filtering

Adding Predictions & Target Labels
python
# After compilation, update with new predictions
xpl.add(
    y_pred=new_predictions,
    proba_values=new_probabilities,
    y_target=new_labels,
    label_dict={0: 'Negative', 1: 'Positive'},
    features_dict=features_dict,
    title_story='Updated Analysis'
)
Working with Additional Data
Add extra features not used by model.

python
# Extra features for filtering/analysis
additional_df = pd.DataFrame({
    'customer_segment': ['VIP', 'Standard', 'Gold'],
    'region': ['North', 'South', 'West']
})

xpl.compile(
    x=X_test,
    additional_data=additional_df,
    additional_features_dict={
        'customer_segment': 'Customer Segment',
        'region': 'Geographic Region'
    }
)

# Use in webapp and reports for filtering
Multi-Class Classification
Handling multi-class problems.

python
# With contributions for each class
contributions_multiclass = [
    contrib_class_0,  # Class 0 contributions
    contrib_class_1,  # Class 1 contributions
    contrib_class_2   # Class 2 contributions
]

xpl = SmartExplainer(
    model=multiclass_model,
    label_dict={
        0: 'Setosa',
        1: 'Versicolor',
        2: 'Virginica'
    }
)

xpl.compile(
    x=X_test,
    contributions=contributions_multiclass,
    y_pred=y_pred
)

# Show for specific class
xpl.plot.features_importance(label=1)  # Versicolor
xpl.plot.local_plot(row_num=0, label=2)  # Virginica
Data Loader
Use pre-built sample datasets.

python
from shapash.data.data_loader import data_loading

# Available: 'titanic', 'house_prices', 'telco_customer_churn'
df, features_dict = data_loading('titanic')

# Explore
print(df.head())
print(features_dict)
Class Wrapper for Projects
python
from shapash import SmartExplainer
import pickle

class ExplainableModel:
    def __init__(self, model, features_dict, label_dict=None):
        self.model = model
        self.features_dict = features_dict
        self.label_dict = label_dict
        self.explainer = None
    
    def setup_explainer(self, X_test, preprocessing=None):
        """Initialize and compile explainer."""
        self.explainer = SmartExplainer(
            model=self.model,
            features_dict=self.features_dict,
            label_dict=self.label_dict,
            preprocessing=preprocessing
        )
        self.explainer.compile(x=X_test)
    
    def explain_instance(self, row_num):
        """Get explanation for single instance."""
        return self.explainer.plot.local_plot(row_num=row_num)
    
    def explain_feature(self, feature_name):
        """Get feature contribution distribution."""
        return self.explainer.plot.contribution_plot(feature_name)
    
    def get_summary(self, max_contrib=5):
        """Export summary table."""
        return self.explainer.to_pandas(max_contrib=max_contrib)
    
    def compare_instances(self, row_nums):
        """Compare multiple predictions."""
        return self.explainer.plot.compare_plot(row_num=row_nums)
    
    def save_model(self, path):
        """Save everything to disk."""
        with open(path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'explainer': self.explainer,
                'features_dict': self.features_dict,
                'label_dict': self.label_dict
            }, f)
    
    @staticmethod
    def load_model(path):
        """Load from disk."""
        with open(path, 'rb') as f:
            data = pickle.load(f)
        obj = ExplainableModel(
            model=data['model'],
            features_dict=data['features_dict'],
            label_dict=data['label_dict']
        )
        obj.explainer = data['explainer']
        return obj

# Usage
model = ExplainableModel(trained_model, features_dict)
model.setup_explainer(X_test)
model.explain_instance(row_num=0)
model.save_model('explainable_model.pkl')
Troubleshooting
Issue	Cause	Solution
Index mismatch	Different indices in x, y_pred, y_target	Align all DataFrames: reset_index()
Feature not found	Typo in feature name	Check xpl.features_dict keys
Slow compile	Large dataset	Use subset for testing
Memory error	Too many points in plot	Reduce max_points parameter
Model incompatible	Model lacks predict() method	Ensure sklearn-compatible interface