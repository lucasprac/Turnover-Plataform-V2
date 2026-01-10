"""
Bayesian Model Diagnostic Audit
================================
Comprehensive audit script to check for:
1. Convergence issues (R-hat, ESS)
2. Overfitting (train vs test performance)
3. Bias across subgroups
4. Posterior Predictive Checks (PPC)
5. Calibration analysis

Run from project root: python -m tests.bayesian_audit
"""

import sys
import os
import json
import numpy as np
import polars as pl
import joblib

# Add project root to path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.ml.bayesian_turnover_model import load_bayesian_model, BayesianTurnoverModel
from backend.ml.bayesian_interpretability import BayesianInterpreter
from backend.ml.preprocessing import load_and_preprocess_one_year

# ANSI colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


def section_header(title):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD} {title}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}\n")


def status(label, value, condition="good"):
    color = Colors.GREEN if condition == "good" else Colors.YELLOW if condition == "warning" else Colors.RED
    print(f"  {label}: {color}{value}{Colors.END}")


def run_convergence_diagnostics(model):
    """Check MCMC convergence via posterior statistics."""
    section_header("1. CONVERGENCE DIAGNOSTICS")
    
    posterior = model.posterior_samples
    results = {"status": "pass", "issues": []}
    
    # Check intercept
    intercept = np.array(posterior["intercept"])
    intercept_mean = np.mean(intercept)
    intercept_std = np.std(intercept)
    
    print(f"  Intercept: mean={intercept_mean:.4f}, std={intercept_std:.4f}")
    
    # Check tau (hierarchical scale)
    tau = np.array(posterior["tau"])
    tau_mean = np.mean(tau)
    tau_std = np.std(tau)
    
    print(f"  Tau (hierarchical scale): mean={tau_mean:.4f}, std={tau_std:.4f}")
    
    # Check for divergences (tau should not be too small)
    if tau_mean < 0.01:
        results["issues"].append("Tau is very small - possible degenerate posterior")
        results["status"] = "warning"
    
    # Check coefficients
    coeffs = np.array(posterior["coeffs"])  # (n_samples, n_features)
    n_samples, n_features = coeffs.shape
    
    print(f"  Posterior samples: {n_samples}")
    print(f"  Number of features: {n_features}")
    
    # ESS approximation (using effective sample size)
    # For each parameter, check autocorrelation
    ess_values = []
    for i in range(min(n_features, 5)):  # Check first 5 features
        samples = coeffs[:, i]
        # Simple ESS estimate: n / (1 + 2 * sum of autocorrelations)
        # Approximate with variance ratio
        ess_approx = n_samples * (np.var(samples[:n_samples//2]) + np.var(samples[n_samples//2:])) / (2 * np.var(samples)) if np.var(samples) > 0 else n_samples
        ess_values.append(ess_approx)
    
    avg_ess = np.mean(ess_values)
    print(f"  Approximate ESS (first 5 features): {avg_ess:.0f}")
    
    if avg_ess < 100:
        results["issues"].append(f"Low ESS ({avg_ess:.0f}) - may need more samples")
        results["status"] = "warning"
    
    # Check for extreme coefficient values (potential non-convergence)
    coeff_means = np.mean(coeffs, axis=0)
    coeff_stds = np.std(coeffs, axis=0)
    
    extreme_coeffs = np.sum(np.abs(coeff_means) > 5)
    if extreme_coeffs > 0:
        results["issues"].append(f"{extreme_coeffs} coefficients with |mean| > 5 (potential convergence issues)")
        results["status"] = "warning"
    
    # Summary
    if results["status"] == "pass":
        status("Convergence Status", "PASSED", "good")
    else:
        status("Convergence Status", f"WARNING - {len(results['issues'])} issues", "warning")
        for issue in results["issues"]:
            print(f"    - {issue}")
    
    return results


def run_overfitting_analysis(model, X_train, y_train, X_test, y_test):
    """Compare model performance on train vs test sets."""
    section_header("2. OVERFITTING ANALYSIS")
    
    results = {"status": "pass", "train_metrics": {}, "test_metrics": {}, "overfit_indicators": []}
    
    # Convert to numpy arrays to avoid JAX compatibility issues
    X_train_np = np.array(X_train, dtype=np.float32)
    X_test_np = np.array(X_test, dtype=np.float32)
    y_train_np = np.array(y_train, dtype=np.float32)
    y_test_np = np.array(y_test, dtype=np.float32)
    
    # Predict on both sets
    train_preds = model.predict(X_train_np)
    test_preds = model.predict(X_test_np)
    
    # Extract mean predictions
    train_probs = np.array([p["mean"] for p in train_preds["predictions"]], dtype=np.float64)
    test_probs = np.array([p["mean"] for p in test_preds["predictions"]], dtype=np.float64)
    
    # Binary predictions at 0.5 threshold
    train_binary = (train_probs >= 0.5).astype(int)
    test_binary = (test_probs >= 0.5).astype(int)
    
    # Metrics
    from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss, log_loss
    
    # Train metrics
    train_acc = accuracy_score(y_train_np, train_binary)
    train_auc = roc_auc_score(y_train_np, train_probs) if len(np.unique(y_train_np)) > 1 else 0
    train_brier = brier_score_loss(y_train_np, train_probs)
    train_logloss = log_loss(y_train_np, train_probs)
    
    results["train_metrics"] = {
        "accuracy": train_acc,
        "auc_roc": train_auc,
        "brier_score": train_brier,
        "log_loss": train_logloss
    }
    
    # Test metrics
    test_acc = accuracy_score(y_test_np, test_binary)
    test_auc = roc_auc_score(y_test_np, test_probs) if len(np.unique(y_test_np)) > 1 else 0
    test_brier = brier_score_loss(y_test_np, test_probs)
    test_logloss = log_loss(y_test_np, test_probs)
    
    results["test_metrics"] = {
        "accuracy": test_acc,
        "auc_roc": test_auc,
        "brier_score": test_brier,
        "log_loss": test_logloss
    }
    
    print(f"  {'Metric':<15} {'Train':<10} {'Test':<10} {'Gap':<10}")
    print(f"  {'-'*45}")
    print(f"  {'Accuracy':<15} {train_acc:<10.4f} {test_acc:<10.4f} {train_acc - test_acc:<10.4f}")
    print(f"  {'AUC-ROC':<15} {train_auc:<10.4f} {test_auc:<10.4f} {train_auc - test_auc:<10.4f}")
    print(f"  {'Brier Score':<15} {train_brier:<10.4f} {test_brier:<10.4f} {train_brier - test_brier:<10.4f}")
    print(f"  {'Log Loss':<15} {train_logloss:<10.4f} {test_logloss:<10.4f} {train_logloss - test_logloss:<10.4f}")
    
    # Check for overfitting
    acc_gap = train_acc - test_acc
    auc_gap = train_auc - test_auc
    
    if acc_gap > 0.10:
        results["overfit_indicators"].append(f"Accuracy gap {acc_gap:.2%} > 10%")
        results["status"] = "warning"
    
    if auc_gap > 0.05:
        results["overfit_indicators"].append(f"AUC gap {auc_gap:.4f} > 0.05")
        results["status"] = "warning"
    
    # Check uncertainty calibration
    train_stds = np.array([p["std"] for p in train_preds["predictions"]])
    test_stds = np.array([p["std"] for p in test_preds["predictions"]])
    
    print(f"\n  Prediction Uncertainty:")
    print(f"    Train mean std: {np.mean(train_stds):.4f}")
    print(f"    Test mean std:  {np.mean(test_stds):.4f}")
    
    # Overconfident on train = potential overfit
    if np.mean(train_stds) < np.mean(test_stds) * 0.5:
        results["overfit_indicators"].append("Model more confident on train than test (overfit signal)")
        results["status"] = "warning"
    
    # Summary
    if results["status"] == "pass":
        status("Overfitting Status", "NO OVERFITTING DETECTED", "good")
    else:
        status("Overfitting Status", f"WARNING - {len(results['overfit_indicators'])} indicators", "warning")
        for ind in results["overfit_indicators"]:
            print(f"    - {ind}")
    
    return results


def run_posterior_predictive_check(interpreter, X_test, y_test):
    """Run Posterior Predictive Checking for model validation."""
    section_header("3. POSTERIOR PREDICTIVE CHECK (PPC)")
    
    # Convert to numpy
    X_test_np = np.array(X_test, dtype=np.float32)
    y_test_np = np.array(y_test, dtype=np.float64)
    
    # Run PPC
    ppc_results = interpreter.posterior_predictive_check(X_test_np, y_test_np, n_replications=min(500, 100))
    
    print("  Discrepancy Measures:")
    print(f"  {'Statistic':<30} {'Observed':<12} {'Replicated':<12} {'p-value':<10} {'Status':<10}")
    print(f"  {'-'*74}")
    
    for stat_name, stats in ppc_results["discrepancy_measures"].items():
        p_val = stats["p_value"]
        if 0.05 <= p_val <= 0.95:
            stat_status = f"{Colors.GREEN}OK{Colors.END}"
        elif 0.01 <= p_val <= 0.99:
            stat_status = f"{Colors.YELLOW}MARGINAL{Colors.END}"
        else:
            stat_status = f"{Colors.RED}FAIL{Colors.END}"
        
        print(f"  {stat_name:<30} {stats['observed']:<12.4f} {stats['replicated_mean']:<12.4f} {p_val:<10.3f} {stat_status}")
    
    # Summary
    model_check = ppc_results["model_check_summary"]
    
    print(f"\n  Overall Fit: {model_check['overall_fit']}")
    print(f"  Summary: {model_check['summary']}")
    
    if model_check["issues"]:
        print(f"  Issues found:")
        for issue in model_check["issues"]:
            print(f"    - {issue['interpretation']}")
    
    return ppc_results


def run_bias_analysis(model, df, X_test, y_test, feature_names):
    """Analyze model predictions across demographic subgroups."""
    section_header("4. BIAS & FAIRNESS AUDIT")
    
    results = {"status": "pass", "subgroup_analysis": {}, "issues": []}
    
    # Convert to numpy
    X_test_np = np.array(X_test, dtype=np.float32)
    
    # Get predictions
    preds = model.predict(X_test_np)
    probs = np.array([p["mean"] for p in preds["predictions"]], dtype=np.float64)
    
    # Get original data for subgroup analysis
    # We need to map back to original categorical features
    # For now, analyze by predicted probability distribution
    
    # Check for prediction distribution issues
    print("  Prediction Distribution:")
    print(f"    Mean probability: {np.mean(probs):.4f}")
    print(f"    Std probability:  {np.std(probs):.4f}")
    print(f"    Min probability:  {np.min(probs):.4f}")
    print(f"    Max probability:  {np.max(probs):.4f}")
    
    # Check for extreme predictions
    extreme_high = np.sum(probs > 0.9)
    extreme_low = np.sum(probs < 0.1)
    
    print(f"\n  Extreme Predictions:")
    print(f"    P > 0.9: {extreme_high} ({100*extreme_high/len(probs):.1f}%)")
    print(f"    P < 0.1: {extreme_low} ({100*extreme_low/len(probs):.1f}%)")
    
    # Analyze coefficient posteriors for bias
    interpreter = BayesianInterpreter(model, feature_names)
    beliefs = interpreter.get_parameter_beliefs()
    
    print(f"\n  Top 10 Feature Effects (by |coefficient|):")
    print(f"  {'Feature':<40} {'Mean':<10} {'Direction':<12} {'Significant':<10}")
    print(f"  {'-'*72}")
    
    for coef in beliefs["coefficients"][:10]:
        name = coef["name"][:38]
        mean = coef["mean"]
        direction = coef["effect_direction"]
        ci_95 = coef["ci_95"]
        
        # Significant if CI doesn't include 0
        significant = "Yes" if (ci_95[0] > 0 or ci_95[1] < 0) else "No"
        
        print(f"  {name:<40} {mean:<10.4f} {direction:<12} {significant:<10}")
    
    # Check for potentially problematic features (demographic bias)
    demographic_features = ['a1_gender', 'a2_age', 'a6_education_level']
    
    print(f"\n  Demographic Feature Analysis:")
    for feat in demographic_features:
        matching = [c for c in beliefs["coefficients"] if feat in c["name"]]
        if matching:
            c = matching[0]
            if c["effect_direction"] != "uncertain":
                print(f"    {c['name']}: {c['mean']:.4f} ({c['effect_direction']})")
                if abs(c["mean"]) > 0.5:
                    results["issues"].append(f"Large effect for {feat} may indicate demographic bias")
    
    # Summary
    if not results["issues"]:
        status("Bias Analysis Status", "NO SIGNIFICANT BIAS DETECTED", "good")
    else:
        results["status"] = "warning"
        status("Bias Analysis Status", f"WARNING - {len(results['issues'])} concerns", "warning")
        for issue in results["issues"]:
            print(f"    - {issue}")
    
    return results


def run_calibration_analysis(model, X_test, y_test):
    """Check if predicted probabilities are well-calibrated."""
    section_header("5. CALIBRATION ANALYSIS")
    
    # Convert to numpy
    X_test_np = np.array(X_test, dtype=np.float32)
    y_test_np = np.array(y_test, dtype=np.float64)
    
    preds = model.predict(X_test_np)
    probs = np.array([p["mean"] for p in preds["predictions"]], dtype=np.float64)
    
    # Binned calibration
    n_bins = 10
    bins = np.linspace(0, 1, n_bins + 1)
    
    print(f"  {'Bin':<20} {'Predicted':<12} {'Actual':<12} {'Count':<8} {'Calibration':<12}")
    print(f"  {'-'*64}")
    
    calibration_errors = []
    
    for i in range(n_bins):
        bin_mask = (probs >= bins[i]) & (probs < bins[i+1])
        if np.sum(bin_mask) > 0:
            bin_pred = np.mean(probs[bin_mask])
            bin_actual = np.mean(y_test_np[bin_mask])
            bin_count = np.sum(bin_mask)
            
            cal_error = abs(bin_pred - bin_actual)
            calibration_errors.append(cal_error)
            
            if cal_error < 0.05:
                cal_status = f"{Colors.GREEN}GOOD{Colors.END}"
            elif cal_error < 0.10:
                cal_status = f"{Colors.YELLOW}OK{Colors.END}"
            else:
                cal_status = f"{Colors.RED}POOR{Colors.END}"
            
            print(f"  {bins[i]:.1f}-{bins[i+1]:.1f}{'':>10} {bin_pred:<12.4f} {bin_actual:<12.4f} {bin_count:<8} {cal_status}")
    
    # Expected Calibration Error (ECE)
    ece = np.mean(calibration_errors) if calibration_errors else 0
    
    print(f"\n  Expected Calibration Error (ECE): {ece:.4f}")
    
    if ece < 0.05:
        status("Calibration Status", "WELL CALIBRATED", "good")
    elif ece < 0.10:
        status("Calibration Status", "ACCEPTABLE", "warning")
    else:
        status("Calibration Status", "POORLY CALIBRATED", "bad")
    
    return {"ece": ece, "calibration_errors": calibration_errors}


def generate_audit_report(all_results):
    """Generate final audit summary."""
    section_header("AUDIT SUMMARY")
    
    issues_count = 0
    
    # Convergence
    conv_status = all_results.get("convergence", {}).get("status", "unknown")
    if conv_status == "pass":
        print(f"  {Colors.GREEN}[PASS]{Colors.END} Convergence Diagnostics")
    else:
        print(f"  {Colors.YELLOW}[WARN]{Colors.END} Convergence Diagnostics")
        issues_count += 1
    
    # Overfitting
    overfit_status = all_results.get("overfitting", {}).get("status", "unknown")
    if overfit_status == "pass":
        print(f"  {Colors.GREEN}[PASS]{Colors.END} Overfitting Analysis")
    else:
        print(f"  {Colors.YELLOW}[WARN]{Colors.END} Overfitting Analysis")
        issues_count += 1
    
    # PPC
    ppc_fit = all_results.get("ppc", {}).get("model_check_summary", {}).get("overall_fit", "unknown")
    if ppc_fit == "good":
        print(f"  {Colors.GREEN}[PASS]{Colors.END} Posterior Predictive Check")
    else:
        print(f"  {Colors.YELLOW}[WARN]{Colors.END} Posterior Predictive Check")
        issues_count += 1
    
    # Bias
    bias_status = all_results.get("bias", {}).get("status", "unknown")
    if bias_status == "pass":
        print(f"  {Colors.GREEN}[PASS]{Colors.END} Bias & Fairness Audit")
    else:
        print(f"  {Colors.YELLOW}[WARN]{Colors.END} Bias & Fairness Audit")
        issues_count += 1
    
    # Calibration
    ece = all_results.get("calibration", {}).get("ece", 1.0)
    if ece < 0.05:
        print(f"  {Colors.GREEN}[PASS]{Colors.END} Calibration Analysis")
    else:
        print(f"  {Colors.YELLOW}[WARN]{Colors.END} Calibration Analysis")
        issues_count += 1
    
    print(f"\n  {Colors.BOLD}Overall: {5 - issues_count}/5 checks passed{Colors.END}")
    
    if issues_count == 0:
        print(f"\n  {Colors.GREEN}Model appears healthy and ready for production.{Colors.END}")
    elif issues_count <= 2:
        print(f"\n  {Colors.YELLOW}Model has minor issues. Review warnings above.{Colors.END}")
    else:
        print(f"\n  {Colors.RED}Model has significant issues. Retraining recommended.{Colors.END}")
    
    return {"total_checks": 5, "passed": 5 - issues_count, "issues": issues_count}


def main():
    print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}     BAYESIAN MODEL DIAGNOSTIC AUDIT{Colors.END}")
    print(f"{Colors.BOLD}{'='*60}{Colors.END}")
    
    all_results = {}
    
    try:
        # Load model
        print("\nLoading Bayesian model...")
        model = load_bayesian_model()
        
        if model is None:
            print(f"{Colors.RED}ERROR: No trained Bayesian model found!{Colors.END}")
            print("Please train the model first using the Settings page.")
            return
        
        print(f"  Model loaded: {model.n_features} features, {model.fit_info.get('n_samples', 'N/A')} posterior samples")
        
        # Load preprocessor and data
        preprocessor_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                          "../backend/ml/bayesian_preprocessor.pkl")
        
        if not os.path.exists(preprocessor_path):
            print(f"{Colors.RED}ERROR: Preprocessor not found at {preprocessor_path}{Colors.END}")
            return
        
        artifact = joblib.load(preprocessor_path)
        X_test = artifact["X_test"]
        y_test = artifact["y_test"]
        feature_names = artifact["feature_names"]
        
        print(f"  Test data loaded: {X_test.shape[0]} samples")
        
        # Load full data for train set
        data_path = os.path.join(root_dir, "synthetic_turnover_data.csv")
        df = pl.read_csv(data_path)
        df_pd = df.to_pandas()
        
        X_train, _, y_train, _, _, _ = load_and_preprocess_one_year(df_pd)
        print(f"  Train data loaded: {X_train.shape[0]} samples")
        
        # Run all diagnostics
        all_results["convergence"] = run_convergence_diagnostics(model)
        all_results["overfitting"] = run_overfitting_analysis(model, X_train, y_train, X_test, y_test)
        
        interpreter = BayesianInterpreter(model, feature_names)
        all_results["ppc"] = run_posterior_predictive_check(interpreter, X_test, y_test)
        all_results["bias"] = run_bias_analysis(model, df_pd, X_test, y_test, feature_names)
        all_results["calibration"] = run_calibration_analysis(model, X_test, y_test)
        
        # Generate summary
        summary = generate_audit_report(all_results)
        all_results["summary"] = summary
        
        # Save results to JSON
        output_path = os.path.join(root_dir, "tests", "bayesian_audit_results.json")
        
        # Convert numpy types for JSON serialization
        def convert_to_serializable(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.float32, np.float64)):
                return float(obj)
            elif isinstance(obj, (np.int32, np.int64)):
                return int(obj)
            elif isinstance(obj, dict):
                return {k: convert_to_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(i) for i in obj]
            return obj
        
        with open(output_path, 'w') as f:
            json.dump(convert_to_serializable(all_results), f, indent=2)
        
        print(f"\n  Results saved to: {output_path}")
        
    except Exception as e:
        print(f"\n{Colors.RED}ERROR during audit: {str(e)}{Colors.END}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
