
"""
Legacy SHAP Fallback Logic - Archived from backend/ml/one_year_model.py
This code was used as a fallback when Shapash SmartPredictor failed.
It is preserved here for reference.
"""

# ... (Previous imports assumed available in scope) ...

# 4. SHAP Explanation (Legacy Fallback)
# try:
#     # Pass the sklearn wrapper directly to TreeExplainer as it handles version discrepancies better than raw booster
#     model_for_shap = model.base_estimator if hasattr(model, 'base_estimator') else model
#     explainer = shap.TreeExplainer(model_for_shap) 
#     shap_values = explainer.shap_values(X_final)
# except Exception as e:
#     print(f"SHAP Error: {e}")
#     # Return empty shap values on failure to not break app
#     return {
#          "turnover_probability": prob,
#          "shap_values": {}
#     }

# # Handle SHAP output shape (binary classification usually returns matrix or list)
# if isinstance(shap_values, list):
#     sv = shap_values[1][0] # Positive class
# else:
#     sv = shap_values[0]
#     
# # Map to feature names
# shap_dict = {}
# for i, name in enumerate(feature_names):
#     shap_dict[name] = float(sv[i])
#     
# return {
#     "turnover_probability": prob,
#     "shap_values": shap_dict
# }
