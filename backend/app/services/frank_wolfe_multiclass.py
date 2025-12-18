import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.metrics import confusion_matrix
import collections

class FrankWolfeMulticlass(BaseEstimator, ClassifierMixin):
    """
    Implements the Consistent Multiclass Algorithm using Frank-Wolfe 
    for G-Mean maximization as per the study.
    
    Ref: "Consistent Multiclass Algorithms for Complex Metrics and Constraints"
    """
    def __init__(self, base_estimator, max_iter=50):
        self.base_estimator = base_estimator
        self.max_iter = max_iter
        self.classes_ = None
        self.cost_weights_ = None # Diagonal of the optimal cost matrix
        self.history_ = []

    def fit(self, X, y):
        self.classes_ = np.unique(y)
        n_classes = len(self.classes_)
        
        # 1. Estimate conditional probabilities eta(x)
        self.base_estimator.fit(X, y)
        probas = self.base_estimator.predict_proba(X)
        
        # 2. Initialize Confusion Matrix C (Estimate from base prediction)
        # Using the base predictor to get an initial confusion matrix
        y_pred_base = self.base_estimator.predict(X)
        C = confusion_matrix(y, y_pred_base, labels=self.classes_, normalize='all')
        
        # 3. Iterative Frank-Wolfe Optimization
        for t in range(self.max_iter):
            # A. Compute Gradient L_t at C_t
            # GM = (Product (C_ii / pi_i))^(1/n)
            # Log GM = 1/n * Sum (log C_ii - log pi_i)
            # d(Log GM)/d C_ii = 1 / (n * C_ii)
            # d(-GM)/d C_ii = - GM * d(Log GM)/d C_ii = - GM / (n * C_ii)
            
            # Extract diagonal C_ii
            diag_C = np.diag(C)
            # Avoid division by zero
            diag_C = np.maximum(diag_C, 1e-9)
            
            # Compute Prior pi_i (approx from C or strictly from data)
            # C is normalized by 'all', so row sums are ~ priors if classifier is decent,
            # but strictly pi_i is fixed from data.
            pi = np.array([np.mean(y == c) for c in self.classes_])
            pi = np.maximum(pi, 1e-9)
            
            # Compute GM
            recall_ratios = diag_C / pi
            gm = np.prod(recall_ratios) ** (1/n_classes)
            
            # Gradient Diagonal: - 1/n * GM / C_ii
            # (Off-diagonal is 0 for G-Mean)
            grad_diag = - (1.0 / n_classes) * gm / diag_C
            
            # L_t is the matrix where diagonal is grad_diag, others 0.
            # LMO: Argmin_h <L_t, C(h)>
            # This is equivalent to cost sensitive classification with costs L_t.
            # Since L_t is diagonal (with negative values), we maximize Sum |L_ii| * P(y=i|x).
            # Cost L_ii is negative gradient. We want to MINIMIZE Cost -> MAXIMIZE -Cost.
            # Weights w_i = - L_ii = (1/n) * GM / C_ii
            
            weights = -grad_diag
            
            # LMO Step: Find Classifier h* that optimizes with these weights
            # h*(x) = argmax_j ( eta_j(x) * weights_j )
            weighted_probas = probas * weights
            y_pred_lmo = np.argmax(weighted_probas, axis=1)
            y_pred_lmo_labels = self.classes_[y_pred_lmo]
            
            # Compute C* from LMO predictions
            C_star = confusion_matrix(y, y_pred_lmo_labels, labels=self.classes_, normalize='all')
            
            # Step Size (Standard FW)
            gamma = 2.0 / (t + 2.0)
            
            # Verify if Line Search is better? 
            # For G-Mean, standard step size is usually sufficient for convergence.
            
            # Update C
            C = (1 - gamma) * C + gamma * C_star
            
            self.history_.append(gm)

        # 4. Finalize
        # The study recommends using the deterministic classifier defined by the final gradient.
        # Costs ~ Final Gradient
        diag_C = np.maximum(np.diag(C), 1e-9)
        pi = np.array([np.mean(y == c) for c in self.classes_])
        pi = np.maximum(pi, 1e-9)
        recall_ratios = diag_C / pi
        gm = np.prod(recall_ratios) ** (1/n_classes)
        
        # Optimal Weights for prediction = - Gradient = GM / (n * C_ii)
        # We can drop constant GM/n
        self.cost_weights_ = 1.0 / diag_C 
        
        return self

    def predict(self, X):
        """
        Deterministic Plug-in Prediction using Optimized Weights.
        """
        probas = self.base_estimator.predict_proba(X)
        
        # Weight probas by the inverse of the optimized confusion diagonal
        # This effectively boosts classes that were hard to classify (low C_ii).
        weighted_probas = probas * self.cost_weights_
        
        predictions = np.argmax(weighted_probas, axis=1)
        return self.classes_[predictions]
    
    def predict_proba(self, X):
        return self.base_estimator.predict_proba(X)

def g_mean_score(y_true, y_pred, labels=None):
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    true_counts = cm.sum(axis=1)
    recalls = np.diag(cm) / np.maximum(true_counts, 1)
    valid_recalls = recalls[true_counts > 0]
    if len(valid_recalls) == 0: return 0.0
    return np.exp(np.mean(np.log(np.maximum(valid_recalls, 1e-6))))
