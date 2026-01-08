"""
Bayesian Turnover Model - Standalone probabilistic prediction system.

Uses NumPyro with NUTS (No-U-Turn Sampler) for full MCMC inference.
This module operates independently from the XGBoost system.
"""

import numpyro
import numpyro.distributions as dist
from numpyro.infer import MCMC, NUTS, Predictive
from jax import random
import jax.numpy as jnp
import jax
import polars as pl
import numpy as np
import time
import logging
import os
import joblib

# Configure logging
logger = logging.getLogger(__name__)

# Model paths
BAYESIAN_MODEL_PATH = os.path.join(os.path.dirname(__file__), "bayesian_model.pkl")


def bayesian_logistic_model(X, y=None):
    """
    Bayesian logistic regression model for turnover prediction.
    
    Priors (regularized):
        - intercept ~ Normal(0, 2)
        - tau ~ HalfCauchy(1)  (hierarchical scale)
        - coefficients ~ Normal(0, tau)
    
    Likelihood:
        - y ~ Bernoulli(sigmoid(X @ coeffs + intercept))
    """
    n_samples, n_features = X.shape
    
    # Priors
    intercept = numpyro.sample("intercept", dist.Normal(0.0, 2.0))
    
    # Hierarchical prior on coefficients (regularization)
    tau = numpyro.sample("tau", dist.HalfCauchy(1.0))
    
    with numpyro.plate("features", n_features):
        coeffs = numpyro.sample("coeffs", dist.Normal(0.0, tau))
    
    # Linear predictor
    logits = intercept + jnp.dot(X, coeffs)
    
    # Probability (for monitoring)
    prob = jax.nn.sigmoid(logits)
    numpyro.deterministic("prob", prob)
    
    # Likelihood
    with numpyro.plate("data", n_samples):
        numpyro.sample("y", dist.Bernoulli(logits=logits), obs=y)


class BayesianTurnoverModel:
    """
    Standalone Bayesian logistic regression for turnover prediction.
    
    Inference method:
        - NUTS: Full MCMC sampling with optimized parameters
    
    Output:
        - Posterior probability distribution
        - Credible intervals (50%, 80%, 95%)
        - Risk band classification
    """
    
    def __init__(self, feature_names: list = None):
        self.feature_names = feature_names or []
        self.n_features = len(self.feature_names)
        self.is_fitted = False
        self.posterior_samples = None
        self.fit_info = {}
    
    def fit_nuts(self, X: np.ndarray, y: np.ndarray, 
                 n_warmup: int = 500, n_samples: int = 1000,
                 progress_callback=None) -> dict:
        """
        Fit model using NUTS (full MCMC).
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Binary target (0/1)
            n_warmup: Number of warmup samples
            n_samples: Number of posterior samples
            progress_callback: Optional callback(progress, message)
        
        Returns:
            Dictionary with fitting metadata
        """
        start_time = time.time()
        logger.info("Fitting Bayesian model with NUTS...")
        if progress_callback:
            progress_callback(10, "Starting NUTS inference...")
        
        X_jax = jnp.array(X, dtype=jnp.float32)
        y_jax = jnp.array(y, dtype=jnp.float32)
        
        self.n_features = X.shape[1]
        
        kernel = NUTS(bayesian_logistic_model)
        mcmc = MCMC(
            kernel, 
            num_warmup=n_warmup, 
            num_samples=n_samples,
            progress_bar=True
        )
        
        rng_key = random.PRNGKey(42)
        
        if progress_callback:
            progress_callback(30, "Running MCMC sampling...")
        
        mcmc.run(rng_key, X_jax, y_jax)
        
        if progress_callback:
            progress_callback(80, "Extracting posterior samples...")
        
        self.posterior_samples = mcmc.get_samples()
        self.is_fitted = True
        
        elapsed = time.time() - start_time
        
        # Get diagnostics
        summary = mcmc.print_summary(prob=0.9)
        
        self.fit_info = {
            "method": "nuts",
            "time_seconds": elapsed,
            "n_samples": n_samples,
            "n_warmup": n_warmup,
            "n_features": self.n_features
        }
        
        logger.info(f"NUTS fitting completed in {elapsed:.2f}s")
        if progress_callback:
            progress_callback(100, "NUTS fitting complete")
        
        return self.fit_info
    
    def predict(self, X: np.ndarray) -> dict:
        """
        Predict turnover probability with uncertainty quantification.
        
        Args:
            X: Feature matrix (n_samples, n_features)
        
        Returns:
            Dictionary with predictions for each sample:
            - mean: Mean probability
            - std: Standard deviation
            - credible_intervals: {ci_50, ci_80, ci_95}
            - risk_band: "High", "Medium", "Low", or "Uncertain"
            - samples: Posterior samples (limited)
        """
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Call fit_nuts() first.")
        
        start_time = time.time()
        X_jax = jnp.array(X, dtype=jnp.float32)
        
        # Get posterior parameters
        intercept = self.posterior_samples["intercept"]  # (n_posterior,)
        coeffs = self.posterior_samples["coeffs"]        # (n_posterior, n_features)
        
        # Compute predictions for all posterior samples
        # Shape: (n_posterior, n_data_points)
        logits = intercept[:, None] + jnp.einsum('pf,df->pd', coeffs, X_jax)
        probs = jax.nn.sigmoid(logits)
        
        elapsed = time.time() - start_time
        
        return self._format_predictions(probs, elapsed)
    
    def predict_single(self, X: np.ndarray) -> dict:
        """
        Predict for a single sample, returning detailed uncertainty.
        
        Args:
            X: Feature vector (1, n_features) or (n_features,)
        
        Returns:
            Single prediction dictionary with uncertainty metrics
        """
        if X.ndim == 1:
            X = X.reshape(1, -1)
        
        result = self.predict(X)
        return result["predictions"][0] if result["predictions"] else None
    
    def _format_predictions(self, probs: jnp.ndarray, elapsed: float) -> dict:
        """Format posterior predictions into structured output."""
        n_data_points = probs.shape[1]
        predictions = []
        
        for i in range(n_data_points):
            sample_probs = probs[:, i]
            predictions.append(self._compute_uncertainty_metrics(sample_probs))
        
        return {
            "predictions": predictions,
            "computation_time": elapsed,
            "method": self.fit_info.get("method", "unknown")
        }
    
    def _compute_uncertainty_metrics(self, sample_probs: jnp.ndarray) -> dict:
        """Compute uncertainty metrics from posterior samples."""
        mean = float(jnp.mean(sample_probs))
        std = float(jnp.std(sample_probs))
        
        ci = {
            "ci_50": [
                float(jnp.percentile(sample_probs, 25)),
                float(jnp.percentile(sample_probs, 75))
            ],
            "ci_80": [
                float(jnp.percentile(sample_probs, 10)),
                float(jnp.percentile(sample_probs, 90))
            ],
            "ci_95": [
                float(jnp.percentile(sample_probs, 2.5)),
                float(jnp.percentile(sample_probs, 97.5))
            ]
        }
        
        # Risk band classification
        ci_width = ci["ci_95"][1] - ci["ci_95"][0]
        if ci_width > 0.3:
            risk_band = "Uncertain"
        elif mean > 0.7:
            risk_band = "High"
        elif mean > 0.4:
            risk_band = "Medium"
        else:
            risk_band = "Low"
        
        return {
            "mean": mean,
            "std": std,
            "credible_intervals": ci,
            "samples": sample_probs.tolist()[:50],  # Limit for API size
            "risk_band": risk_band
        }
    
    def save(self, path: str = None):
        """Save model to disk."""
        path = path or BAYESIAN_MODEL_PATH
        artifact = {
            "feature_names": self.feature_names,
            "n_features": self.n_features,
            "posterior_samples": {
                k: np.array(v) for k, v in self.posterior_samples.items()
            },
            "fit_info": self.fit_info,
            "is_fitted": self.is_fitted
        }
        joblib.dump(artifact, path)
        logger.info(f"Bayesian model saved to {path}")
    
    @classmethod
    def load(cls, path: str = None) -> "BayesianTurnoverModel":
        """Load model from disk."""
        path = path or BAYESIAN_MODEL_PATH
        if not os.path.exists(path):
            return None
        
        artifact = joblib.load(path)
        model = cls(feature_names=artifact["feature_names"])
        model.n_features = artifact["n_features"]
        model.posterior_samples = {
            k: jnp.array(v) for k, v in artifact["posterior_samples"].items()
        }
        model.fit_info = artifact["fit_info"]
        model.is_fitted = artifact["is_fitted"]
        
        logger.info(f"Bayesian model loaded from {path}")
        return model


# === Training and Prediction Functions ===

def train_bayesian_model(data_path: str = "synthetic_turnover_data.csv",
                         progress_callback=None) -> BayesianTurnoverModel:
    """
    Train the Bayesian turnover model using NUTS inference.
    
    Args:
        data_path: Path to CSV data
        progress_callback: Optional callback(progress, message)
    
    Returns:
        Trained BayesianTurnoverModel
    """
    from backend.ml.preprocessing import load_and_preprocess_one_year
    
    logger.info("Training Bayesian model with NUTS...")
    if progress_callback:
        progress_callback(5, "Loading and preprocessing data...")
    
    # Load data with Polars, convert to pandas for sklearn preprocessing
    df_polars = pl.read_csv(data_path)
    df = df_polars.to_pandas()  # sklearn preprocessor requires pandas
    X_train, X_test, y_train, y_test, feature_names, preprocessor = \
        load_and_preprocess_one_year(df)
    
    # Store test data for PPC
    y_test_np = np.array(y_test)
    
    if progress_callback:
        progress_callback(15, "Data preprocessed, starting NUTS inference...")
    
    model = BayesianTurnoverModel(feature_names=feature_names)
    
    # Use NUTS with optimized parameters for better convergence
    model.fit_nuts(X_train, y_train, n_warmup=500, n_samples=1000, 
                   progress_callback=progress_callback)
    
    # Save model
    model.save()
    
    # Save preprocessor and test data separately for prediction pipeline and PPC
    preprocessor_path = os.path.join(os.path.dirname(__file__), "bayesian_preprocessor.pkl")
    joblib.dump({
        "preprocessor": preprocessor,
        "feature_names": feature_names,
        "X_test": X_test,
        "y_test": y_test_np  # For Posterior Predictive Checking
    }, preprocessor_path)
    
    logger.info("Bayesian model and preprocessor saved")
    return model


def load_bayesian_model() -> BayesianTurnoverModel:
    """Load the trained Bayesian model."""
    return BayesianTurnoverModel.load()


def predict_bayesian_individual(input_data: dict) -> dict:
    """
    Predict turnover probability for a single individual using Bayesian model.
    
    Args:
        input_data: Dictionary of employee features
    
    Returns:
        Dictionary with uncertainty metrics
    """
    from backend.ml.preprocessing import feature_engineering
    
    # Load model
    model = load_bayesian_model()
    if model is None:
        raise FileNotFoundError("Bayesian model not trained. Please train first.")
    
    # Load preprocessor
    preprocessor_path = os.path.join(os.path.dirname(__file__), "bayesian_preprocessor.pkl")
    if not os.path.exists(preprocessor_path):
        raise FileNotFoundError("Preprocessor not found. Please retrain model.")
    
    preprocessor_artifact = joblib.load(preprocessor_path)
    preprocessor = preprocessor_artifact["preprocessor"]
    feature_names = preprocessor_artifact["feature_names"]
    
    # Preprocess input with Polars
    df_input = pl.DataFrame(input_data)
    df_engineered = feature_engineering(df_input.to_pandas())  # sklearn needs pandas
    X_processed = preprocessor.transform(df_engineered)
    
    # Predict
    result = model.predict_single(X_processed)
    
    return result


def predict_bayesian_aggregate(cohort_data: list) -> dict:
    """
    Predict turnover for a cohort using Bayesian model.
    
    Args:
        cohort_data: List of employee feature dictionaries
    
    Returns:
        Aggregate uncertainty metrics
    """
    from backend.ml.preprocessing import feature_engineering
    
    model = load_bayesian_model()
    if model is None:
        raise FileNotFoundError("Bayesian model not trained. Please train first.")
    
    preprocessor_path = os.path.join(os.path.dirname(__file__), "bayesian_preprocessor.pkl")
    preprocessor_artifact = joblib.load(preprocessor_path)
    preprocessor = preprocessor_artifact["preprocessor"]
    
    # Preprocess cohort with Polars
    df_cohort = pl.DataFrame(cohort_data)
    df_engineered = feature_engineering(df_cohort.to_pandas())  # sklearn needs pandas
    X_processed = preprocessor.transform(df_engineered)
    
    # Predict for all
    result = model.predict(X_processed)
    
    # Aggregate: sum of predicted turnovers
    predictions = result["predictions"]
    
    # Aggregate uncertainty by summing individual predictions
    all_means = [p["mean"] for p in predictions]
    predicted_count = sum(all_means)
    
    # For aggregate CI, we sum the samples across individuals
    # This gives us the distribution of total turnover count
    n_posterior = len(predictions[0]["samples"])
    aggregate_samples = []
    
    for i in range(n_posterior):
        total = sum(p["samples"][i] if i < len(p["samples"]) else p["mean"] 
                    for p in predictions)
        aggregate_samples.append(total)
    
    aggregate_samples = np.array(aggregate_samples)
    
    return {
        "predicted_turnover_count": predicted_count,
        "total_in_cohort": len(cohort_data),
        "cohort_risk_rate": (predicted_count / len(cohort_data)) * 100 if cohort_data else 0,
        "uncertainty": {
            "mean": float(np.mean(aggregate_samples)),
            "std": float(np.std(aggregate_samples)),
            "credible_intervals": {
                "ci_50": [float(np.percentile(aggregate_samples, 25)),
                         float(np.percentile(aggregate_samples, 75))],
                "ci_80": [float(np.percentile(aggregate_samples, 10)),
                         float(np.percentile(aggregate_samples, 90))],
                "ci_95": [float(np.percentile(aggregate_samples, 2.5)),
                         float(np.percentile(aggregate_samples, 97.5))]
            },
            "risk_band": "Uncertain" if np.std(aggregate_samples) > 5 else "Normal"
        },
        "computation_time": result["computation_time"],
        "method": result["method"]
    }
