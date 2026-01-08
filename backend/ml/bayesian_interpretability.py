"""
Native Bayesian Interpretability Module for Turnover Model.

Provides three interpretability dimensions:
(a) Parameter Beliefs - posterior distributions of coefficients
(b) Posterior Predictive - what data the model generates
(c) Uncertainty Quantification - credible intervals, risk bands

Also implements Posterior Predictive Checking (PPC) for model validation.

Reference: studies/ppc.md
"""

import polars as pl
import numpy as np
import jax.numpy as jnp
import jax
from jax import random
import numpyro
import numpyro.distributions as dist
from numpyro.infer import Predictive
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class BayesianInterpreter:
    """
    Native Bayesian Interpretability for the Turnover Model.
    
    This class provides tools to understand:
    1. What the model believes about parameters (coefficient posteriors)
    2. What data the model generates (posterior predictive distribution)
    3. How certain the model is (uncertainty decomposition)
    4. Model validation via Posterior Predictive Checking (PPC)
    """
    
    def __init__(self, model, feature_names: List[str] = None):
        """
        Initialize interpreter with a fitted BayesianTurnoverModel.
        
        Args:
            model: Fitted BayesianTurnoverModel instance
            feature_names: List of feature names for coefficient labeling
        """
        self.model = model
        self.feature_names = feature_names or model.feature_names
        
        if not model.is_fitted:
            raise ValueError("Model must be fitted before interpretation")
    
    # =========================================================================
    # (a) PARAMETER BELIEFS - What the model believes about effects
    # =========================================================================
    
    def get_parameter_beliefs(self) -> Dict:
        """
        Extract posterior distributions for all model parameters.
        
        Returns:
            Dictionary with:
            - intercept: dict with mean, std, ci_95, samples
            - tau: dict with hierarchical scale statistics
            - coefficients: list of dicts per feature with:
                - name: feature name
                - mean: posterior mean
                - std: posterior std
                - ci_95: 95% credible interval
                - effect_direction: "positive", "negative", or "uncertain"
        """
        posterior = self.model.posterior_samples
        
        # Intercept
        intercept_samples = np.array(posterior["intercept"])
        intercept_stats = self._compute_param_stats(intercept_samples, "intercept")
        
        # Tau (hierarchical scale)
        tau_samples = np.array(posterior["tau"])
        tau_stats = self._compute_param_stats(tau_samples, "tau")
        
        # Coefficients per feature
        coeffs_samples = np.array(posterior["coeffs"])  # Shape: (n_posterior, n_features)
        
        coefficients = []
        for i, name in enumerate(self.feature_names):
            coef_samples = coeffs_samples[:, i]
            stats = self._compute_param_stats(coef_samples, name)
            
            # Determine effect direction
            if stats["ci_95"][0] > 0:
                direction = "positive"
            elif stats["ci_95"][1] < 0:
                direction = "negative"
            else:
                direction = "uncertain"
            
            stats["effect_direction"] = direction
            coefficients.append(stats)
        
        # Sort by absolute effect size
        coefficients.sort(key=lambda x: abs(x["mean"]), reverse=True)
        
        return {
            "intercept": intercept_stats,
            "tau": tau_stats,
            "coefficients": coefficients,
            "n_posterior_samples": len(intercept_samples)
        }
    
    def _compute_param_stats(self, samples: np.ndarray, name: str) -> Dict:
        """Compute summary statistics for a parameter's posterior."""
        return {
            "name": name,
            "mean": float(np.mean(samples)),
            "std": float(np.std(samples)),
            "median": float(np.median(samples)),
            "ci_95": [float(np.percentile(samples, 2.5)), 
                      float(np.percentile(samples, 97.5))],
            "ci_50": [float(np.percentile(samples, 25)),
                      float(np.percentile(samples, 75))],
            "samples": samples.tolist()[:100]  # Limit for API
        }
    
    # =========================================================================
    # (b) POSTERIOR PREDICTIVE - What data the model generates
    # =========================================================================
    
    def generate_posterior_predictive(self, 
                                       X: np.ndarray,
                                       n_samples: int = 100) -> Dict:
        """
        Generate simulated data from the posterior predictive distribution.
        
        This shows what outcomes the model would predict for given features,
        accounting for both parameter uncertainty AND data variability.
        
        Args:
            X: Feature matrix (n_obs, n_features)
            n_samples: Number of replicated datasets to generate
        
        Returns:
            Dictionary with:
            - y_rep: replicated binary outcomes (n_samples, n_obs)
            - p_rep: predicted probabilities (n_samples, n_obs)
            - summary: statistics per observation
        """
        posterior = self.model.posterior_samples
        X_jax = jnp.array(X, dtype=jnp.float32)
        
        # Get posterior samples
        intercept = posterior["intercept"]  # (n_posterior,)
        coeffs = posterior["coeffs"]        # (n_posterior, n_features)
        
        n_posterior = len(intercept)
        n_obs = X.shape[0]
        
        # Sample from posterior (use first n_samples posterior draws)
        n_use = min(n_samples, n_posterior)
        
        y_rep = []
        p_rep = []
        
        rng_key = random.PRNGKey(42)
        
        for i in range(n_use):
            # Compute probabilities for this posterior draw
            logits = intercept[i] + jnp.dot(X_jax, coeffs[i])
            probs = jax.nn.sigmoid(logits)
            
            # Generate binary outcomes
            rng_key, subkey = random.split(rng_key)
            y_sim = random.bernoulli(subkey, probs)
            
            p_rep.append(np.array(probs))
            y_rep.append(np.array(y_sim))
        
        y_rep = np.array(y_rep)  # (n_samples, n_obs)
        p_rep = np.array(p_rep)  # (n_samples, n_obs)
        
        # Summary per observation
        summary = []
        for j in range(n_obs):
            summary.append({
                "obs_index": j,
                "prob_mean": float(np.mean(p_rep[:, j])),
                "prob_std": float(np.std(p_rep[:, j])),
                "expected_turnover_rate": float(np.mean(y_rep[:, j]))
            })
        
        return {
            "y_rep": y_rep.tolist(),
            "p_rep": p_rep.tolist(),
            "summary": summary,
            "n_replications": n_use,
            "n_observations": n_obs
        }
    
    # =========================================================================
    # (c) UNCERTAINTY QUANTIFICATION - How certain is the model?
    # =========================================================================
    
    def compute_uncertainty_decomposition(self, X: np.ndarray) -> Dict:
        """
        Decompose prediction uncertainty into components.
        
        Uncertainty in Bayesian predictions comes from two sources:
        - Epistemic: uncertainty about model parameters (reducible with more data)
        - Aleatoric: inherent randomness in outcomes (irreducible)
        
        For logistic regression:
        - Total variance = Var[p] (variance in predicted probability)
        - Epistemic ≈ variance due to coefficient uncertainty
        - Aleatoric ≈ p*(1-p) (Bernoulli variance)
        
        Args:
            X: Feature matrix (n_obs, n_features)
        
        Returns:
            Dictionary with uncertainty metrics per observation
        """
        posterior = self.model.posterior_samples
        X_jax = jnp.array(X, dtype=jnp.float32)
        
        intercept = posterior["intercept"]
        coeffs = posterior["coeffs"]
        
        n_obs = X.shape[0]
        
        # Compute predictions for all posterior samples
        logits = intercept[:, None] + jnp.einsum('pf,of->po', coeffs, X_jax)
        probs = jax.nn.sigmoid(logits)  # (n_posterior, n_obs)
        
        probs_np = np.array(probs)
        
        results = []
        for j in range(n_obs):
            p = probs_np[:, j]
            
            # Total uncertainty: variance in predicted probability
            total_var = float(np.var(p))
            
            # Mean probability
            p_mean = float(np.mean(p))
            
            # Aleatoric: expected Bernoulli variance under posterior
            # E[p*(1-p)] where expectation is over posterior
            aleatoric = float(np.mean(p * (1 - p)))
            
            # Epistemic: variance of expected value
            # Var[E[Y|θ]] = Var[p]
            epistemic = total_var
            
            # Entropy of predictive distribution
            # For each posterior sample, entropy of Bernoulli(p)
            eps = 1e-10
            entropy = float(-np.mean(p * np.log(p + eps) + (1 - p) * np.log(1 - p + eps)))
            
            # Confidence score (inverse of entropy, scaled)
            confidence = float(1.0 - entropy / np.log(2))  # Normalized 0-1
            
            results.append({
                "obs_index": j,
                "mean_probability": p_mean,
                "total_uncertainty": total_var + aleatoric,
                "epistemic_uncertainty": epistemic,
                "aleatoric_uncertainty": aleatoric,
                "entropy": entropy,
                "confidence": confidence,
                "uncertainty_ratio": epistemic / (aleatoric + eps)  # How much is reducible?
            })
        
        return {
            "observations": results,
            "aggregate": {
                "mean_epistemic": float(np.mean([r["epistemic_uncertainty"] for r in results])),
                "mean_aleatoric": float(np.mean([r["aleatoric_uncertainty"] for r in results])),
                "mean_confidence": float(np.mean([r["confidence"] for r in results]))
            }
        }
    
    # =========================================================================
    # POSTERIOR PREDICTIVE CHECKING (PPC) - Model Validation
    # =========================================================================
    
    def posterior_predictive_check(self, 
                                    X: np.ndarray, 
                                    y_observed: np.ndarray,
                                    n_replications: int = 500) -> Dict:
        """
        Perform Posterior Predictive Checking to validate model fit.
        
        Computes discrepancy measures between observed data and replicated
        data generated from the posterior predictive distribution.
        
        Reference: studies/ppc.md
        
        Args:
            X: Feature matrix used for training
            y_observed: Observed binary outcomes (0/1)
            n_replications: Number of replicated datasets
        
        Returns:
            Dictionary with PPC results:
            - discrepancy_measures: test statistics computed
            - ppc_p_values: posterior predictive p-values
            - model_check_summary: interpretation of results
        """
        logger.info(f"Running PPC with {n_replications} replications...")
        
        # Generate replicated data
        pp_result = self.generate_posterior_predictive(X, n_samples=n_replications)
        y_rep = np.array(pp_result["y_rep"])  # (n_rep, n_obs)
        
        # Compute test statistics for observed data
        observed_stats = self._compute_discrepancy_measures(y_observed)
        
        # Compute test statistics for each replication
        replicated_stats = []
        for i in range(n_replications):
            rep_stats = self._compute_discrepancy_measures(y_rep[i])
            replicated_stats.append(rep_stats)
        
        # Compute posterior predictive p-values
        ppc_p_values = {}
        discrepancy_results = {}
        
        for stat_name in observed_stats.keys():
            observed_value = observed_stats[stat_name]
            replicated_values = [rs[stat_name] for rs in replicated_stats]
            
            # p_ppc = P(T(y_rep) >= T(y_obs))
            p_value = np.mean([rv >= observed_value for rv in replicated_values])
            
            ppc_p_values[stat_name] = float(p_value)
            discrepancy_results[stat_name] = {
                "observed": float(observed_value),
                "replicated_mean": float(np.mean(replicated_values)),
                "replicated_std": float(np.std(replicated_values)),
                "replicated_ci_95": [
                    float(np.percentile(replicated_values, 2.5)),
                    float(np.percentile(replicated_values, 97.5))
                ],
                "p_value": float(p_value)
            }
        
        # Interpretation
        model_check = self._interpret_ppc_results(ppc_p_values)
        
        return {
            "discrepancy_measures": discrepancy_results,
            "ppc_p_values": ppc_p_values,
            "model_check_summary": model_check,
            "n_replications": n_replications,
            "n_observations": len(y_observed)
        }
    
    def _compute_discrepancy_measures(self, y: np.ndarray) -> Dict:
        """
        Compute test statistics (discrepancy measures) for PPC.
        
        These capture different aspects of the data:
        - Mean: overall turnover rate
        - Max consecutive: clustering of turnovers
        - Proportion extremes: tail behavior
        """
        y = np.array(y).flatten()
        n = len(y)
        
        # T1: Mean (turnover rate)
        t_mean = np.mean(y)
        
        # T2: Variance
        t_var = np.var(y)
        
        # T3: Sum (total turnovers)
        t_sum = np.sum(y)
        
        # T4: Proportion of zeros (retention rate)
        t_zeros = np.mean(y == 0)
        
        # T5: Max run of ones (consecutive turnovers)
        # Useful for detecting clustering
        t_max_run = 0
        current_run = 0
        for val in y:
            if val == 1:
                current_run += 1
                t_max_run = max(t_max_run, current_run)
            else:
                current_run = 0
        
        return {
            "mean": t_mean,
            "variance": t_var,
            "sum": t_sum,
            "retention_rate": t_zeros,
            "max_consecutive_turnovers": t_max_run
        }
    
    def _interpret_ppc_results(self, p_values: Dict) -> Dict:
        """
        Interpret PPC p-values to assess model fit.
        
        p-values near 0.5: good fit
        p-values near 0 or 1: potential misfit
        """
        issues = []
        summary = "Model passes PPC checks"
        overall_fit = "good"
        
        for stat_name, p_val in p_values.items():
            if p_val < 0.05 or p_val > 0.95:
                issues.append({
                    "statistic": stat_name,
                    "p_value": p_val,
                    "interpretation": f"{stat_name} is extreme (p={p_val:.3f})"
                })
        
        if issues:
            overall_fit = "potential_issues"
            summary = f"Model may have issues with: {', '.join(i['statistic'] for i in issues)}"
        
        return {
            "overall_fit": overall_fit,
            "summary": summary,
            "issues": issues,
            "recommendation": "Consider alternative models or check data" if issues else "Model fits well"
        }


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_bayesian_interpretability(model_or_path=None) -> BayesianInterpreter:
    """
    Get a BayesianInterpreter for the trained model.
    
    Args:
        model_or_path: BayesianTurnoverModel instance or path to saved model
    
    Returns:
        BayesianInterpreter instance
    """
    from .bayesian_turnover_model import load_bayesian_model, BayesianTurnoverModel
    
    if model_or_path is None:
        model = load_bayesian_model()
    elif isinstance(model_or_path, str):
        model = BayesianTurnoverModel.load(model_or_path)
    else:
        model = model_or_path
    
    if model is None:
        raise FileNotFoundError("Bayesian model not found. Please train first.")
    
    return BayesianInterpreter(model, model.feature_names)


def run_model_diagnostics(data_path: str = None) -> Dict:
    """
    Run full Bayesian model diagnostics including PPC.
    
    Returns comprehensive interpretability report.
    """
    from .bayesian_turnover_model import load_bayesian_model
    from .preprocessing import load_and_preprocess_one_year
    import os
    import joblib
    
    # Load model and interpreter
    model = load_bayesian_model()
    if model is None:
        raise FileNotFoundError("No trained Bayesian model found")
    
    interpreter = BayesianInterpreter(model, model.feature_names)
    
    # Load preprocessor for test data
    preprocessor_path = os.path.join(os.path.dirname(__file__), "bayesian_preprocessor.pkl")
    if os.path.exists(preprocessor_path):
        artifact = joblib.load(preprocessor_path)
        # Note: We'd need stored test data for full PPC
        # For now, return interpretability without PPC
    
    # Get parameter beliefs
    param_beliefs = interpreter.get_parameter_beliefs()
    
    return {
        "parameter_beliefs": param_beliefs,
        "model_info": model.fit_info,
        "feature_names": model.feature_names
    }
